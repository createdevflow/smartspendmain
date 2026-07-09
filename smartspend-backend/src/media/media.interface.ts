export type StorageProviderType = 'MINIO' | 'S3' | 'LOCAL' | 'R2' | 'GCS' | 'AZURE';

export type MediaModule =
  | 'users'
  | 'business'
  | 'blog'
  | 'chat'
  | 'invoices'
  | 'receipts'
  | 'reports'
  | 'exports'
  | 'system';

export type MediaStatus = 'ACTIVE' | 'ARCHIVED' | 'DELETED' | 'EXPIRED';

export type ResponsiveSize = 'thumbnail' | 'small' | 'medium' | 'large' | 'original';

export interface Dimensions {
  width?: number;
  height?: number;
  thumbnail?: string;
  small?: string;
  medium?: string;
  large?: string;
  original?: string;
}

export interface MediaMetadata {
  pages?: number;
  strippedExif?: boolean;
  originalName?: string;
  duration?: number;
  format?: string;
  [key: string]: any;
}

export interface IStorageProvider {
  putObject(bucket: string, key: string, buffer: Buffer, mimeType: string): Promise<void>;
  getObject(bucket: string, key: string): Promise<Buffer>;
  getObjectStream(
    bucket: string,
    key: string,
    range?: { start: number; end: number },
  ): Promise<{ stream: NodeJS.ReadableStream; contentLength: number; contentType?: string }>;
  statObject(bucket: string, key: string): Promise<{ size: number; lastModified: Date; etag: string } | null>;
  removeObject(bucket: string, key: string): Promise<void>;
  listObjects(bucket: string, prefix?: string): Promise<string[]>;
  getPublicUrl(bucket: string, key: string): string;
  getProviderType(): StorageProviderType;
}

export interface UploadOptions {
  module: MediaModule;
  ownerId?: string;
  originalName?: string;
  customMetadata?: Record<string, any>;
  generateResponsiveSizes?: boolean;
}

export interface UploadResult {
  id: string;
  key: string;
  url: string;
  hash: string;
  size: number;
  compressedSize?: number;
  originalSize?: number;
  type: string;
  dimensions?: Dimensions;
  metadata?: MediaMetadata;
  isDuplicate: boolean;
}
