import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { APP_FEATURE_KEYS } from '../admin/admin.service';

/**
 * Public app configuration endpoint.
 * Returns public feature flags — polled by mobile app every 10s.
 */
@ApiTags('app-config')
@Controller({ path: 'app-config', version: '1' })
export class AppConfigController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'Get public app configuration and feature flags' })
  async getPublicConfig() {
    const settings = await this.prisma.appConfig.findMany({
      where: { key: { in: APP_FEATURE_KEYS } },
    });

    const config: Record<string, boolean | string> = {};
    const teaseModes: Record<string, boolean> = {};

    for (const key of APP_FEATURE_KEYS) {
      const found = settings.find(s => s.key === key);
      let rawValue = found?.value;
      if (rawValue === undefined) {
        if (key.endsWith('_url')) rawValue = '';
        else if (['maintenance_mode', 'feature_beta', 'feature_whatsapp_active', 'feature_ocr_active', 'feature_gamification_active', 'download_ios_enabled'].includes(key)) rawValue = 'false';
        else rawValue = 'true';
      }
      if (rawValue === 'true') config[key] = true;
      else if (rawValue === 'false') config[key] = false;
      else config[key] = rawValue;

      teaseModes[key] = found?.teaseMode ?? false;
    }

    return {
      success: true,
      data: {
        config,
        teaseModes,
        updatedAt: new Date().toISOString(),
      }
    };
  }

  @Public()
  @Get('metrics')
  @ApiOperation({ summary: 'Get public landing page metrics' })
  async getPublicMetrics() {
    const totalUsers = await this.prisma.user.count();
    const totalTransactions = await this.prisma.transaction.count();
    const activeCashbooks = await this.prisma.cashbook.count();
    const totalBudgets = await this.prisma.budget.count();
    
    return {
      success: true,
      data: {
        totalUsers,
        totalTransactions,
        totalBudgets,
        activeCashbooks,
      }
    };
  }
}
