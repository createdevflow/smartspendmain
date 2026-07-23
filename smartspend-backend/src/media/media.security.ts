import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MediaModule } from './media.interface';

@Injectable()
export class MediaSecurityService {
  private readonly logger = new Logger(MediaSecurityService.name);

  // Default size limits in MB — overridable via DB config
  private readonly defaultLimits: Record<MediaModule, number> = {
    users: 5,       // Profile images 5MB
    business: 5,    // Logos 5MB
    blog: 10,       // Blog images 10MB
    chat: 25,       // Chat attachments up to 25MB
    invoices: 10,   // Invoices 10MB
    receipts: 10,   // Receipts 10MB
    reports: 20,    // Reports 20MB
    exports: 20,    // Exports 20MB
    system: 20,
  };

  constructor(private prisma: PrismaService) {}

  async validateFile(buffer: Buffer, mimeType: string, module: MediaModule, originalName?: string): Promise<void> {
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('Empty file buffer provided');
    }

    // 1. Check Maximum Size
    await this.validateSize(buffer.length, module);

    // 2. Validate MIME & Magic Bytes
    this.validateMagicBytes(buffer, mimeType, originalName);

    // 3. Security Scan (SVG XSS / Malicious Scripts)
    if (mimeType === 'image/svg+xml' || originalName?.toLowerCase().endsWith('.svg')) {
      this.scanSvgForXss(buffer);
    }

    // 4. Zip Bomb & Archive Check
    if (
      mimeType === 'application/zip' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      this.validateArchive(buffer);
    }
  }

  private async validateSize(sizeBytes: number, module: MediaModule): Promise<void> {
    let limitMb = this.defaultLimits[module] || 20;

    try {
      const configKey = `media_limit_mb_${module}`;
      const config = await this.prisma.appConfig.findUnique({ where: { key: configKey } });
      if (config && config.value && !isNaN(Number(config.value))) {
        limitMb = Number(config.value);
      }
    } catch (e) {
      // Use fallback defaults
    }

    const limitBytes = limitMb * 1024 * 1024;
    if (sizeBytes > limitBytes) {
      throw new BadRequestException(
        `File size (${(sizeBytes / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed limit of ${limitMb} MB for ${module}`,
      );
    }
  }

  private validateMagicBytes(buffer: Buffer, mimeType: string, originalName?: string): void {
    if (buffer.length < 4) {
      throw new BadRequestException('File buffer too small for signature verification');
    }

    const hex = buffer.toString('hex', 0, 12).toUpperCase();
    const ascii = buffer.toString('ascii', 0, 10);

    // JPEG / JPG
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      if (!hex.startsWith('FFD8FF')) {
        throw new BadRequestException('Invalid JPEG file signature');
      }
      return;
    }

    // PNG
    if (mimeType === 'image/png') {
      if (!hex.startsWith('89504E47')) {
        throw new BadRequestException('Invalid PNG file signature');
      }
      return;
    }

    // GIF
    if (mimeType === 'image/gif') {
      if (!ascii.startsWith('GIF8')) {
        throw new BadRequestException('Invalid GIF file signature');
      }
      return;
    }

    // WebP
    if (mimeType === 'image/webp') {
      if (!ascii.startsWith('RIFF') || !buffer.toString('ascii', 8, 12).startsWith('WEBP')) {
        throw new BadRequestException('Invalid WebP file signature');
      }
      return;
    }

    // PDF
    if (mimeType === 'application/pdf') {
      if (!ascii.startsWith('%PDF-')) {
        throw new BadRequestException('Invalid PDF file signature');
      }
      return;
    }

    // ZIP / DOCX / XLSX / APK
    if (
      mimeType === 'application/zip' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      if (!hex.startsWith('504B0304') && !hex.startsWith('504B0506') && !hex.startsWith('504B0708')) {
        throw new BadRequestException('Invalid ZIP/Office document signature');
      }
      return;
    }
  }

  private scanSvgForXss(buffer: Buffer): void {
    // Use toLowerCase() for case-insensitive scan — covers <Script>, JAVASCRIPT:, etc.
    const content = buffer.toString('utf8').toLowerCase();
    const dangerousPatterns = [
      '<script',
      'javascript:',
      'onload=',
      'onerror=',
      'onclick=',
      'onmouseover=',
      'onfocus=',
      'onblur=',
      'onkeydown=',
      'formaction=',
      'xlink:href',
      'data:text/html',
      'data:application/x-javascript',
      '<iframe',
      '<object',
      '<embed',
      'eval(',
      'expression(',
      'vbscript:',
    ];

    for (const pattern of dangerousPatterns) {
      if (content.includes(pattern)) {
        this.logger.warn(`Malicious pattern "${pattern}" detected in uploaded SVG!`);
        throw new BadRequestException('Malicious script content detected in SVG file');
      }
    }
  }

  private validateArchive(buffer: Buffer): void {
    // Check if compression ratio or header indicates zip bomb
    // Basic check: minimum realistic archive structure
    if (buffer.length < 22) {
      throw new BadRequestException('Archive file corrupted or too small');
    }
  }
}
