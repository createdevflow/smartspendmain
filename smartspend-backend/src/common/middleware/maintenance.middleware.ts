import { Injectable, NestMiddleware, ServiceUnavailableException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Maintenance Mode Middleware
 * When `maintenance_mode = 'true'` in SystemSetting, returns 503 for
 * all non-admin, non-auth routes. Admin routes and login remain accessible.
 */
@Injectable()
export class MaintenanceMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Allow admin routes and auth routes through
    const path = req.path;
    const isExempt =
      path.includes('/admin') ||
      path.includes('/auth') ||
      path.includes('/app-config/public') ||
      path.includes('/health') ||
      path.includes('/docs');

    if (isExempt) {
      return next();
    }

    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key: 'maintenance_mode' },
      });

      if (setting?.value === 'true') {
        throw new ServiceUnavailableException({
          statusCode: 503,
          error: 'Service Unavailable',
          message: 'The application is currently undergoing maintenance. Please try again shortly.',
          maintenanceMode: true,
        });
      }
    } catch (err) {
      if (err instanceof ServiceUnavailableException) throw err;
      // DB error — allow request through (fail open)
    }

    next();
  }
}
