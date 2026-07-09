import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { FeaturesService } from '../plans/features.service';
import { MediaService } from '../media/media.service';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(
    private features: FeaturesService,
    private mediaService: MediaService,
  ) {}

  async uploadReceipt(userId: string, file: Express.Multer.File) {
    const canUpload = await this.features.canUse(userId, 'receipt_upload');
    if (!canUpload) throw new ForbiddenException('Receipt uploads require a premium plan');

    try {
      const result = await this.mediaService.uploadMedia(file, {
        module: 'receipts',
        ownerId: userId,
        generateResponsiveSizes: true,
      });

      return {
        id: result.id,
        key: result.key,
        url: result.url,
        hash: result.hash,
        isDuplicate: result.isDuplicate,
        size: result.size,
        dimensions: result.dimensions,
      };
    } catch (e: any) {
      this.logger.error('Receipt upload failed via MediaService', e);
      throw e;
    }
  }

  async cleanupOrphanedReceipts() {
    this.logger.log('Orphaned receipts cleanup is now handled automatically by global MediaCleanupService.');
  }
}
