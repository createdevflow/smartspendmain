import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Headers,
  Res,
  UseInterceptors,
  UploadedFile,
  Body,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { MediaService } from './media.service';
import { MediaModule, ResponsiveSize } from './media.interface';
import { Public } from '../common/decorators/public.decorator';


@Controller('media')
export class MediaController {
  private readonly logger = new Logger(MediaController.name);

  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('module') module: string = 'system',
    @Body('ownerId') ownerId?: string,
    @Body('generateResponsive') generateResponsive?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const validModules: MediaModule[] = [
      'users',
      'business',
      'blog',
      'chat',
      'invoices',
      'receipts',
      'reports',
      'exports',
      'system',
    ];
    const mediaModule = validModules.includes(module as MediaModule) ? (module as MediaModule) : 'system';

    const result = await this.mediaService.uploadMedia(file, {
      module: mediaModule,
      ownerId,
      generateResponsiveSizes: generateResponsive !== 'false',
    });

    return {
      success: true,
      data: result,
    };
  }

  @Post('upload-base64')
  async uploadBase64(
    @Body('base64') base64: string,
    @Body('module') module: string = 'system',
    @Body('ownerId') ownerId?: string,
    @Body('generateResponsive') generateResponsive?: string,
  ) {
    if (!base64) {
      throw new BadRequestException('No base64 data provided');
    }

    const validModules: MediaModule[] = [
      'users',
      'business',
      'blog',
      'chat',
      'invoices',
      'receipts',
      'reports',
      'exports',
      'system',
    ];
    const mediaModule = validModules.includes(module as MediaModule) ? (module as MediaModule) : 'system';

    const result = await this.mediaService.uploadBase64(base64, {
      module: mediaModule,
      ownerId,
      generateResponsiveSizes: generateResponsive !== 'false',
    });

    return {
      success: true,
      data: result,
    };
  }

  @Public()
  @Get(':id')
  async serveMedia(
    @Param('id') id: string,
    @Query('size') size: string,
    @Headers('range') rangeHeader: string,
    @Res() res: Response,
  ) {
    const responsiveSize = (size as ResponsiveSize) || 'original';
    let range: { start: number; end: number } | undefined;

    // We first need asset details to know total size if range is requested
    const asset = await this.mediaService.getMediaById(id);
    const totalSize = asset.size;

    if (rangeHeader && rangeHeader.startsWith('bytes=')) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

      if (!isNaN(start) && !isNaN(end) && start <= end && end < totalSize) {
        range = { start, end };
      }
    }

    const { stream, contentLength, contentType } = await this.mediaService.getMediaStream(id, responsiveSize, range);

    // Set aggressive caching for immutable assets
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('ETag', `"${asset.hash}-${responsiveSize}"`);
    res.setHeader('Accept-Ranges', 'bytes');
    if (contentType || asset.type) {
      res.setHeader('Content-Type', contentType || asset.type);
    }

    if (range) {
      res.status(HttpStatus.PARTIAL_CONTENT);
      res.setHeader('Content-Range', `bytes ${range.start}-${range.end}/${totalSize}`);
      res.setHeader('Content-Length', contentLength);
    } else {
      res.status(HttpStatus.OK);
      res.setHeader('Content-Length', contentLength);
    }

    // Increment download count asynchronously
    this.mediaService.incrementDownload(id);

    stream.pipe(res);
  }

  @Public()
  @Get('file/*')
  async serveFileByKey(@Param() params: any, @Res() res: Response) {
    let keyPath = params[0];
    if (!keyPath) {
      throw new BadRequestException('File key path missing');
    }

    let requestedSize: ResponsiveSize = 'original';
    if (keyPath.includes('_thumb.')) {
      requestedSize = 'thumbnail';
      keyPath = keyPath.replace('_thumb.', '.');
    } else if (keyPath.includes('_small.')) {
      requestedSize = 'small';
      keyPath = keyPath.replace('_small.', '.');
    } else if (keyPath.includes('_medium.')) {
      requestedSize = 'medium';
      keyPath = keyPath.replace('_medium.', '.');
    } else if (keyPath.includes('_large.')) {
      requestedSize = 'large';
      keyPath = keyPath.replace('_large.', '.');
    }

    // Extract filename from the end of the key path (bucket is at start)
    const filename = keyPath.split('/').pop();

    // Attempt to locate asset by storageKey
    const asset = await this.mediaService['prisma'].mediaAsset.findFirst({
      where: { storageKey: { endsWith: filename }, status: 'ACTIVE' },
    });

    if (asset) {
      return this.serveMedia(asset.id, requestedSize, '', res);
    }

    throw new BadRequestException('File not found by path');
  }
}
