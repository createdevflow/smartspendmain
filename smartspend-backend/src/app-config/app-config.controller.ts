import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Public app configuration endpoint.
 * Returns only public feature flags — no auth required.
 * Mobile app polls this to check maintenance mode and feature availability.
 */
@ApiTags('app-config')
@Controller({ path: 'app-config', version: '1' })
export class AppConfigController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'Get public app configuration and feature flags (no auth required)' })
  async getPublicConfig() {
    const publicKeys = [
      'maintenance_mode',
      'feature_transactions',
      'feature_cashbooks',
      'feature_categories',
      'feature_analytics',
      'feature_reports',
      'feature_notifications',
      'feature_budget_management',
      'feature_savings_goals',
      'feature_multi_device_sync',
      'feature_backup_restore',
      'feature_export',
      'feature_import',
      'feature_user_registration',
      'feature_profile_editing',
      'feature_account_deletion',
      'feature_app_updates',
      'feature_beta',
      'feature_whatsapp_active',
      'feature_ocr_active',
      'feature_gamification_active',
      'feature_shared_cashbooks_active',
      'feature_tax_export_active',
      'feature_panic_button_active',
    ];

    const settings = await this.prisma.systemSetting.findMany({
      where: { key: { in: publicKeys } },
    });

    const config: Record<string, boolean | string> = {};
    for (const key of publicKeys) {
      const found = settings.find(s => s.key === key);
      const rawValue = found?.value ?? (key === 'maintenance_mode' ? 'false' : 'true');
      // Parse booleans
      if (rawValue === 'true') config[key] = true;
      else if (rawValue === 'false') config[key] = false;
      else config[key] = rawValue;
    }

    return {
      config,
      updatedAt: new Date().toISOString(),
    };
  }
}
