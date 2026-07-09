import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MediaStorageProvider } from './media.storage';
import { MediaSecurityService } from './media.security';
import { MediaOptimizerService } from './media.optimizer';
import { Dimensions, MediaMetadata, ResponsiveSize, UploadOptions, UploadResult } from './media.interface';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly defaultBucket: string;

  constructor(
    private prisma: PrismaService,
    private storage: MediaStorageProvider,
    private security: MediaSecurityService,
    private optimizer: MediaOptimizerService,
    private config: ConfigService,
  ) {
    this.defaultBucket = this.config.get<string>('minio.bucketMedia', 'media');
  }

  async uploadBase64(base64String: string, options: UploadOptions): Promise<UploadResult> {
    if (!base64String || (!base64String.startsWith('data:') && base64String.length < 500)) {
      return {
        id: '',
        key: '',
        url: base64String,
        hash: '',
        size: 0,
        type: '',
        isDuplicate: false,
      };
    }

    let mimeType = 'application/octet-stream';
    let base64Data = base64String;
    let ext = 'bin';

    if (base64String.startsWith('data:')) {
      const matches = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        mimeType = matches[1];
        base64Data = matches[2];
      } else {
        const parts = base64String.split(';base64,');
        if (parts.length === 2) {
          mimeType = parts[0].replace('data:', '');
          base64Data = parts[1];
        }
      }
    }

    if (mimeType.includes('image/jpeg') || mimeType.includes('image/jpg')) ext = 'jpg';
    else if (mimeType.includes('image/png')) ext = 'png';
    else if (mimeType.includes('image/webp')) ext = 'webp';
    else if (mimeType.includes('image/gif')) ext = 'gif';
    else if (mimeType.includes('pdf')) ext = 'pdf';
    else if (mimeType.includes('audio/m4a') || mimeType.includes('audio/mp4') || mimeType.includes('audio/aac')) ext = 'm4a';
    else if (mimeType.includes('audio/')) ext = 'mp3';
    else if (mimeType.includes('video/')) ext = 'mp4';

    const buffer = Buffer.from(base64Data, 'base64');
    const file: Express.Multer.File = {
      fieldname: 'file',
      originalname: `upload_${Date.now()}.${ext}`,
      encoding: '7bit',
      mimetype: mimeType,
      buffer,
      size: buffer.length,
      stream: null as any,
      destination: '',
      filename: '',
      path: '',
    };

    return this.uploadMedia(file, options);
  }

  async uploadMedia(file: Express.Multer.File, options: UploadOptions): Promise<UploadResult> {
    const originalName = file.originalname || options.originalName || 'file.bin';
    const originalSize = file.buffer.length;

    // Step 1: Security Scan & Size Validation
    await this.security.validateFile(file.buffer, file.mimetype, options.module, originalName);

    // Step 2: Compression & Optimization
    let processedBuffer = file.buffer;
    let finalMime = file.mimetype;
    let ext = originalName.split('.').pop()?.toLowerCase() || 'bin';
    let dimensions: Dimensions | undefined;
    let metadata: MediaMetadata = { originalName, ...options.customMetadata };
    let responsiveBuffers: Record<ResponsiveSize, Buffer> | undefined;

    if (file.mimetype.startsWith('image/')) {
      const optResult = await this.optimizer.optimizeImage(file.buffer, options.generateResponsiveSizes !== false);
      processedBuffer = optResult.originalBuffer;
      finalMime = optResult.format;
      ext = 'webp';
      dimensions = optResult.dimensions;
      responsiveBuffers = optResult.responsiveBuffers;
      metadata.strippedExif = true;
    } else {
      const docMeta = this.optimizer.extractDocumentMetadata(file.buffer, file.mimetype, originalName);
      metadata = { ...metadata, ...docMeta };
    }

    // Step 3: Hash Generation (SHA-256)
    const hash = crypto.createHash('sha256').update(processedBuffer).digest('hex');

    // Step 4: Storage Deduplication
    const existing = await this.prisma.mediaAsset.findFirst({
      where: {
        hash,
        status: 'ACTIVE',
      },
    });

    if (existing) {
      this.logger.log(`Deduplication hit for hash ${hash}. Reusing existing asset ID ${existing.id}`);
      await this.prisma.mediaAsset.update({
        where: { id: existing.id },
        data: {
          usageCount: { increment: 1 },
          downloads: { increment: 1 },
        },
      });

      return {
        id: existing.id,
        key: existing.storageKey,
        url: existing.url,
        hash: existing.hash,
        size: existing.size,
        compressedSize: existing.compressedSize || undefined,
        originalSize: existing.originalSize || undefined,
        type: existing.type,
        dimensions: (existing.dimensions as Dimensions) || undefined,
        metadata: (existing.metadata as MediaMetadata) || undefined,
        isDuplicate: true,
      };
    }

    // Step 5: Storage Upload
    const key = `${options.module}/${hash}.${ext}`;
    const filePath = `/${this.defaultBucket}/${key}`;
    await this.storage.putObject(this.defaultBucket, key, processedBuffer, finalMime);

    // Upload responsive size variants if present
    if (responsiveBuffers) {
      const sizeUrls: Dimensions = { width: dimensions?.width, height: dimensions?.height };
      for (const [sizeName, buf] of Object.entries(responsiveBuffers)) {
        if (sizeName === 'original') {
          sizeUrls.original = this.storage.getPublicUrl(this.defaultBucket, key);
          continue;
        }
        const sizeKey = `${options.module}/${hash}_${sizeName}.${ext}`;
        await this.storage.putObject(this.defaultBucket, sizeKey, buf, finalMime);
        sizeUrls[sizeName as keyof Dimensions] = this.storage.getPublicUrl(this.defaultBucket, sizeKey) as any;
      }
      dimensions = sizeUrls;
    }

    const publicUrl = this.storage.getPublicUrl(this.defaultBucket, key);

    // Step 6: Database Reference
    const asset = await this.prisma.mediaAsset.create({
      data: {
        filePath,
        storageKey: key,
        url: publicUrl,
        hash,
        size: processedBuffer.length,
        compressedSize: processedBuffer.length < originalSize ? processedBuffer.length : null,
        originalSize,
        type: finalMime,
        dimensions: dimensions as any,
        metadata: metadata as any,
        ownerId: options.ownerId || null,
        module: options.module,
        status: 'ACTIVE',
        storageLocation: this.storage.getProviderType(),
      },
    });

    return {
      id: asset.id,
      key: asset.storageKey,
      url: asset.url,
      hash: asset.hash,
      size: asset.size,
      compressedSize: asset.compressedSize || undefined,
      originalSize: asset.originalSize || undefined,
      type: asset.type,
      dimensions: (asset.dimensions as Dimensions) || undefined,
      metadata: (asset.metadata as MediaMetadata) || undefined,
      isDuplicate: false,
    };
  }

  async getMediaById(id: string) {
    const asset = await this.prisma.mediaAsset.findUnique({
      where: { id },
    });
    if (!asset || asset.status === 'DELETED') {
      throw new NotFoundException('Media asset not found');
    }
    return asset;
  }

  async getMediaStream(id: string, size?: ResponsiveSize, range?: { start: number; end: number }) {
    const asset = await this.getMediaById(id);
    let targetKey = asset.storageKey;

    if (size && size !== 'original' && asset.dimensions) {
      const dim = asset.dimensions as Dimensions;
      const sizeUrl = dim[size];
      if (sizeUrl && typeof sizeUrl === 'string') {
        const parts = sizeUrl.split('/');
        const possibleKey = parts.slice(parts.indexOf(this.defaultBucket) + 1).join('/');
        if (possibleKey) targetKey = possibleKey;
      }
    }

    const streamInfo = await this.storage.getObjectStream(this.defaultBucket, targetKey, range);
    return {
      ...streamInfo,
      asset,
    };
  }

  async incrementDownload(id: string): Promise<void> {
    await this.prisma.mediaAsset.update({
      where: { id },
      data: { downloads: { increment: 1 } },
    }).catch(() => {});
  }
}
