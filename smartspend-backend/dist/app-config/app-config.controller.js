"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppConfigController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("../common/decorators/public.decorator");
const prisma_service_1 = require("../prisma/prisma.service");
let AppConfigController = class AppConfigController {
    constructor(prisma) {
        this.prisma = prisma;
    }
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
        const config = {};
        for (const key of publicKeys) {
            const found = settings.find(s => s.key === key);
            const rawValue = found?.value ?? (key === 'maintenance_mode' ? 'false' : 'true');
            if (rawValue === 'true')
                config[key] = true;
            else if (rawValue === 'false')
                config[key] = false;
            else
                config[key] = rawValue;
        }
        return {
            config,
            updatedAt: new Date().toISOString(),
        };
    }
};
exports.AppConfigController = AppConfigController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('public'),
    (0, swagger_1.ApiOperation)({ summary: 'Get public app configuration and feature flags (no auth required)' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppConfigController.prototype, "getPublicConfig", null);
exports.AppConfigController = AppConfigController = __decorate([
    (0, swagger_1.ApiTags)('app-config'),
    (0, common_1.Controller)({ path: 'app-config', version: '1' }),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AppConfigController);
//# sourceMappingURL=app-config.controller.js.map