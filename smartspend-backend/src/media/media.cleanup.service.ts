import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MediaStorageProvider } from './media.storage';
import { Dimensions } from './media.interface';

@Injectable()
export class MediaCleanupService {
  private readonly logger = new Logger(MediaCleanupService.name);
  private readonly defaultBucket: string;

  constructor(
    private prisma: PrismaService,
    private storage: MediaStorageProvider,
    private config: ConfigService,
  ) {
    this.defaultBucket = this.config.get<string>('minio.bucketMedia', 'media');
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleDailyCleanup() {
    this.logger.log('Starting daily media maintenance and cleanup jobs...');
    await this.cleanupExpiredExports();
    await this.cleanupOrphanedAssets();
    this.logger.log('Daily media maintenance completed.');
  }

  async cleanupExpiredExports(retentionDays = 30): Promise<number> {
    try {
      // Check if retention is overridden in AppConfig
      const config = await this.prisma.appConfig.findUnique({ where: { key: 'media_export_retention_days' } });
      if (config && config.value && !isNaN(Number(config.value))) {
        retentionDays = Number(config.value);
      }
    } catch (e) {
      // Ignore fallback
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    this.logger.log(`Scanning for temporary exports older than ${retentionDays} days (before ${cutoffDate.toISOString()})...`);

    const expiredAssets = await this.prisma.mediaAsset.findMany({
      where: {
        module: { in: ['exports', 'reports'] },
        status: 'ACTIVE',
        uploadDate: { lt: cutoffDate },
      },
    });

    let cleanedCount = 0;
    for (const asset of expiredAssets) {
      try {
        await this.storage.removeObject(this.defaultBucket, asset.storageKey);

        if (asset.dimensions) {
          const dim = asset.dimensions as Dimensions;
          for (const [key, url] of Object.entries(dim)) {
            if (typeof url === 'string' && url.includes(this.defaultBucket)) {
              const parts = url.split('/');
              const sizeKey = parts.slice(parts.indexOf(this.defaultBucket) + 1).join('/');
              if (sizeKey && sizeKey !== asset.storageKey) {
                await this.storage.removeObject(this.defaultBucket, sizeKey).catch(() => {});
              }
            }
          }
        }

        await this.prisma.mediaAsset.update({
          where: { id: asset.id },
          data: { status: 'EXPIRED' },
        });

        cleanedCount++;
      } catch (e) {
        this.logger.error(`Failed to clean up expired export ${asset.id} (${asset.storageKey})`, e);
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(`Successfully cleaned up and expired ${cleanedCount} temporary export files.`);
    }
    return cleanedCount;
  }

  async cleanupOrphanedAssets(): Promise<number> {
    this.logger.log('Scanning for orphaned media assets with 0 references...');

    // Assets marked ACTIVE with usageCount <= 0 and older than 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const orphanedAssets = await this.prisma.mediaAsset.findMany({
      where: {
        status: 'ACTIVE',
        usageCount: { lte: 0 },
        uploadDate: { lt: oneDayAgo },
        module: { not: 'system' }, // Never auto-delete system assets
      },
    });

    let archivedCount = 0;
    for (const asset of orphanedAssets) {
      try {
        // Double check against User avatars or Blog covers before deleting
        const isAvatar = await this.prisma.user.findFirst({ where: { avatar: asset.url } });
        if (isAvatar) {
          await this.prisma.mediaAsset.update({ where: { id: asset.id }, data: { usageCount: 1 } });
          continue;
        }

        await this.storage.removeObject(this.defaultBucket, asset.storageKey);
        await this.prisma.mediaAsset.update({
          where: { id: asset.id },
          data: { status: 'ARCHIVED' },
        });

        archivedCount++;
      } catch (e) {
        this.logger.error(`Failed to archive orphaned asset ${asset.id}`, e);
      }
    }

    if (archivedCount > 0) {
      this.logger.log(`Successfully archived ${archivedCount} orphaned media assets.`);
    }
    return archivedCount;
  }
}
