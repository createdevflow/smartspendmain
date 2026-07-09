import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';
import { Dimensions, MediaMetadata, ResponsiveSize } from './media.interface';

export interface OptimizedImageResult {
  originalBuffer: Buffer;
  width: number;
  height: number;
  size: number;
  format: string;
  responsiveBuffers?: Record<ResponsiveSize, Buffer>;
  dimensions: Dimensions;
}

@Injectable()
export class MediaOptimizerService {
  private readonly logger = new Logger(MediaOptimizerService.name);

  async optimizeImage(buffer: Buffer, generateResponsive = true): Promise<OptimizedImageResult> {
    try {
      const metadata = await sharp(buffer).metadata();
      const width = metadata.width || 800;
      const height = metadata.height || 600;

      // Strip EXIF, auto rotate, convert to high-quality WebP
      const originalBuffer = await sharp(buffer)
        .rotate()
        .resize({ width: Math.min(width, 2400), height: Math.min(height, 2400), fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82, effort: 4 })
        .toBuffer();

      const origMeta = await sharp(originalBuffer).metadata();
      const finalWidth = origMeta.width || width;
      const finalHeight = origMeta.height || height;

      const dimensions: Dimensions = {
        width: finalWidth,
        height: finalHeight,
      };

      if (!generateResponsive || finalWidth < 200) {
        return {
          originalBuffer,
          width: finalWidth,
          height: finalHeight,
          size: originalBuffer.length,
          format: 'image/webp',
          dimensions,
        };
      }

      // Generate responsive sizes
      const responsiveBuffers: Record<ResponsiveSize, Buffer> = {
        original: originalBuffer,
        thumbnail: await sharp(buffer)
          .rotate()
          .resize(150, 150, { fit: 'cover' })
          .webp({ quality: 75 })
          .toBuffer(),
        small: await sharp(buffer)
          .rotate()
          .resize({ width: 300, height: 300, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 78 })
          .toBuffer(),
        medium: await sharp(buffer)
          .rotate()
          .resize({ width: 600, height: 600, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer(),
        large: await sharp(buffer)
          .rotate()
          .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer(),
      };

      return {
        originalBuffer,
        width: finalWidth,
        height: finalHeight,
        size: originalBuffer.length,
        format: 'image/webp',
        responsiveBuffers,
        dimensions,
      };
    } catch (e) {
      this.logger.error('Image optimization failed. Returning original buffer.', e);
      return {
        originalBuffer: buffer,
        width: 0,
        height: 0,
        size: buffer.length,
        format: 'application/octet-stream',
        dimensions: {},
      };
    }
  }

  extractDocumentMetadata(buffer: Buffer, mimeType: string, originalName?: string): MediaMetadata {
    const metadata: MediaMetadata = {
      originalName,
      format: mimeType.split('/').pop() || 'unknown',
    };

    if (mimeType === 'application/pdf') {
      try {
        const content = buffer.toString('utf8');
        // Simple heuristic count of PDF page tree objects
        const pageMatches = content.match(/\/Type\s*\/Page\b/g);
        if (pageMatches && pageMatches.length > 0) {
          metadata.pages = pageMatches.length;
        } else {
          // Alternative check for /Count
          const countMatch = content.match(/\/Count\s+(\d+)/);
          if (countMatch && countMatch[1]) {
            metadata.pages = parseInt(countMatch[1], 10);
          }
        }
      } catch (e) {
        this.logger.warn('Failed to extract PDF page count', e);
      }
    }

    return metadata;
  }
}
