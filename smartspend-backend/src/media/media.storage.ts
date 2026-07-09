import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import * as fs from 'fs';
import * as path from 'path';
import { IStorageProvider, StorageProviderType } from './media.interface';

@Injectable()
export class MediaStorageProvider implements IStorageProvider {
  private minioClient: Minio.Client | null = null;
  private isMinioAvailable = false;
  private readonly logger = new Logger(MediaStorageProvider.name);
  private localUploadDir: string;

  constructor(private config: ConfigService) {
    this.localUploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.localUploadDir)) {
      fs.mkdirSync(this.localUploadDir, { recursive: true });
    }

    try {
      this.minioClient = new Minio.Client({
        endPoint: this.config.get<string>('minio.endpoint', 'localhost'),
        port: this.config.get<number>('minio.port', 9000),
        useSSL: this.config.get<boolean>('minio.useSsl', false),
        accessKey: this.config.get<string>('minio.accessKey', 'minioadmin'),
        secretKey: this.config.get<string>('minio.secretKey', 'minioadmin'),
      });
      this.isMinioAvailable = true;
      this.logger.log('MinIO storage provider initialized');
    } catch (e) {
      this.logger.warn('MinIO initialization failed. Falling back to local disk storage.', e);
      this.isMinioAvailable = false;
    }
  }

  private async ensureBucket(bucket: string): Promise<void> {
    if (this.isMinioAvailable && this.minioClient) {
      try {
        const exists = await this.minioClient.bucketExists(bucket);
        if (!exists) {
          await this.minioClient.makeBucket(bucket, 'us-east-1');
        }
      } catch (e) {
        this.logger.error(`Failed to ensure MinIO bucket ${bucket}. Switching to local fallback.`, e);
        this.isMinioAvailable = false;
      }
    }

    if (!this.isMinioAvailable) {
      const bucketDir = path.join(this.localUploadDir, bucket);
      if (!fs.existsSync(bucketDir)) {
        fs.mkdirSync(bucketDir, { recursive: true });
      }
    }
  }

  async putObject(bucket: string, key: string, buffer: Buffer, mimeType: string): Promise<void> {
    await this.ensureBucket(bucket);

    if (this.isMinioAvailable && this.minioClient) {
      try {
        await this.minioClient.putObject(bucket, key, buffer, buffer.length, {
          'Content-Type': mimeType,
        });
        return;
      } catch (e) {
        this.logger.error(`MinIO putObject failed for ${bucket}/${key}. Using local fallback.`, e);
        this.isMinioAvailable = false;
      }
    }

    // Local Disk Fallback
    const filePath = path.join(this.localUploadDir, bucket, key);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await fs.promises.writeFile(filePath, buffer);
  }

  async getObject(bucket: string, key: string): Promise<Buffer> {
    if (this.isMinioAvailable && this.minioClient) {
      try {
        const stream = await this.minioClient.getObject(bucket, key);
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        return Buffer.concat(chunks);
      } catch (e) {
        this.logger.warn(`MinIO getObject failed for ${bucket}/${key}. Checking local storage.`, e);
      }
    }

    const filePath = path.join(this.localUploadDir, bucket, key);
    if (fs.existsSync(filePath)) {
      return fs.promises.readFile(filePath);
    }
    throw new Error(`File not found: ${bucket}/${key}`);
  }

  async getObjectStream(
    bucket: string,
    key: string,
    range?: { start: number; end: number },
  ): Promise<{ stream: NodeJS.ReadableStream; contentLength: number; contentType?: string }> {
    if (this.isMinioAvailable && this.minioClient) {
      try {
        const stat = await this.minioClient.statObject(bucket, key);
        if (range) {
          const length = range.end - range.start + 1;
          const stream = await this.minioClient.getPartialObject(bucket, key, range.start, length);
          return { stream, contentLength: length, contentType: stat.metaData?.['content-type'] };
        }
        const stream = await this.minioClient.getObject(bucket, key);
        return { stream, contentLength: stat.size, contentType: stat.metaData?.['content-type'] };
      } catch (e) {
        this.logger.warn(`MinIO getObjectStream failed for ${bucket}/${key}. Checking local storage.`, e);
      }
    }

    const filePath = path.join(this.localUploadDir, bucket, key);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${bucket}/${key}`);
    }
    const stat = await fs.promises.stat(filePath);
    if (range) {
      const length = range.end - range.start + 1;
      const stream = fs.createReadStream(filePath, { start: range.start, end: range.end });
      return { stream, contentLength: length };
    }
    const stream = fs.createReadStream(filePath);
    return { stream, contentLength: stat.size };
  }

  async statObject(bucket: string, key: string): Promise<{ size: number; lastModified: Date; etag: string } | null> {
    if (this.isMinioAvailable && this.minioClient) {
      try {
        const stat = await this.minioClient.statObject(bucket, key);
        return {
          size: stat.size,
          lastModified: stat.lastModified,
          etag: stat.etag,
        };
      } catch (e) {
        // Fallthrough to local
      }
    }

    const filePath = path.join(this.localUploadDir, bucket, key);
    if (fs.existsSync(filePath)) {
      const stat = await fs.promises.stat(filePath);
      return {
        size: stat.size,
        lastModified: stat.mtime,
        etag: `${stat.size}-${stat.mtimeMs}`,
      };
    }
    return null;
  }

  async removeObject(bucket: string, key: string): Promise<void> {
    if (this.isMinioAvailable && this.minioClient) {
      try {
        await this.minioClient.removeObject(bucket, key);
      } catch (e) {
        this.logger.warn(`MinIO removeObject failed for ${bucket}/${key}`, e);
      }
    }

    const filePath = path.join(this.localUploadDir, bucket, key);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  async listObjects(bucket: string, prefix = ''): Promise<string[]> {
    if (this.isMinioAvailable && this.minioClient) {
      try {
        const stream = this.minioClient.listObjectsV2(bucket, prefix, true);
        const keys: string[] = [];
        for await (const obj of stream) {
          if (obj.name) keys.push(obj.name);
        }
        return keys;
      } catch (e) {
        this.logger.warn(`MinIO listObjects failed for ${bucket}`, e);
      }
    }

    const bucketDir = path.join(this.localUploadDir, bucket);
    if (!fs.existsSync(bucketDir)) return [];
    
    const results: string[] = [];
    const scanDir = (dir: string, base: string) => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        const relPath = path.join(base, item.name).replace(/\\/g, '/');
        if (item.isDirectory()) {
          scanDir(fullPath, relPath);
        } else if (relPath.startsWith(prefix)) {
          results.push(relPath);
        }
      }
    };
    scanDir(bucketDir, '');
    return results;
  }

  getPublicUrl(bucket: string, key: string): string {
    if (this.isMinioAvailable && this.minioClient) {
      const publicUrl = this.config.get<string>('minio.publicUrl', 'http://localhost:9000');
      return `${publicUrl}/${bucket}/${key}`;
    }
    // Return backend API stream endpoint URL as fallback
    const backendUrl = this.config.get<string>('app.url', 'http://localhost:3000');
    return `${backendUrl}/media/file/${bucket}/${key}`;
  }

  getProviderType(): StorageProviderType {
    return this.isMinioAvailable ? 'MINIO' : 'LOCAL';
  }
}
