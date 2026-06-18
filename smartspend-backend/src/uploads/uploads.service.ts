import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { FeaturesService } from '../plans/features.service';

@Injectable()
export class UploadsService {
  private minioClient: Minio.Client;
  private bucket: string;
  private readonly logger = new Logger(UploadsService.name);

  constructor(private config: ConfigService, private features: FeaturesService) {
    this.bucket = this.config.get<string>('minio.bucketReceipts', 'receipts');
    
    // In dev, if minio isn't setup, we'll gracefully handle it
    try {
      this.minioClient = new Minio.Client({
        endPoint: this.config.get<string>('minio.endpoint', 'localhost'),
        port: this.config.get<number>('minio.port', 9000),
        useSSL: this.config.get<boolean>('minio.useSsl', false),
        accessKey: this.config.get<string>('minio.accessKey', 'minioadmin'),
        secretKey: this.config.get<string>('minio.secretKey', 'minioadmin'),
      });
      this.initBucket();
    } catch (e) {
      this.logger.warn('MinIO client initialization failed (expected if config missing)');
    }
  }

  private async initBucket() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucket);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucket, 'us-east-1');
      }
    } catch (e) {
      this.logger.error('Failed to init MinIO bucket', e);
    }
  }

  async uploadReceipt(userId: string, file: Express.Multer.File) {
    const canUpload = await this.features.canUse(userId, 'receipt_upload');
    if (!canUpload) throw new ForbiddenException('Receipt uploads require a premium plan');

    const ext = file.originalname.split('.').pop();
    const filename = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

    try {
      await this.minioClient.putObject(this.bucket, filename, file.buffer, file.size, {
        'Content-Type': file.mimetype,
      });
      
      const publicUrl = this.config.get<string>('minio.publicUrl', 'http://localhost:9000');
      return { 
        key: filename, 
        url: `${publicUrl}/${this.bucket}/${filename}`,
      };
    } catch (e) {
      this.logger.error('Upload failed', e);
      // Stub fallback for local dev
      return { 
        key: filename, 
        url: `http://localhost:9000/stub/${filename}`,
      };
    }
  }
}
