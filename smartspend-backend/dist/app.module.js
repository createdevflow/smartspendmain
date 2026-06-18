"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const schedule_1 = require("@nestjs/schedule");
const core_1 = require("@nestjs/core");
const throttler_2 = require("@nestjs/throttler");
const configuration_1 = require("./config/configuration");
const validation_schema_1 = require("./config/validation.schema");
const prisma_module_1 = require("./prisma/prisma.module");
const cache_module_1 = require("./cache/cache.module");
const crypto_module_1 = require("./crypto/crypto.module");
const mail_module_1 = require("./mail/mail.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const plans_module_1 = require("./plans/plans.module");
const cashbooks_module_1 = require("./cashbooks/cashbooks.module");
const categories_module_1 = require("./categories/categories.module");
const transactions_module_1 = require("./transactions/transactions.module");
const passbook_module_1 = require("./passbook/passbook.module");
const budgets_module_1 = require("./budgets/budgets.module");
const goals_module_1 = require("./goals/goals.module");
const analytics_module_1 = require("./analytics/analytics.module");
const currency_module_1 = require("./currency/currency.module");
const notifications_module_1 = require("./notifications/notifications.module");
const uploads_module_1 = require("./uploads/uploads.module");
const support_module_1 = require("./support/support.module");
const admin_module_1 = require("./admin/admin.module");
const audit_module_1 = require("./audit/audit.module");
const scheduler_module_1 = require("./scheduler/scheduler.module");
const export_module_1 = require("./export/export.module");
const app_config_module_1 = require("./app-config/app-config.module");
const maintenance_middleware_1 = require("./common/middleware/maintenance.middleware");
let AppModule = class AppModule {
    configure(consumer) {
        consumer
            .apply(maintenance_middleware_1.MaintenanceMiddleware)
            .forRoutes({ path: '*', method: common_1.RequestMethod.ALL });
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [configuration_1.default],
                validationSchema: validation_schema_1.validationSchema,
                validationOptions: { allowUnknown: true, abortEarly: false },
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    throttlers: [
                        {
                            name: 'short',
                            ttl: config.get('THROTTLE_TTL', 60) * 1000,
                            limit: config.get('THROTTLE_LIMIT', 100),
                        },
                    ],
                }),
            }),
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            cache_module_1.CacheModule,
            crypto_module_1.CryptoModule,
            mail_module_1.MailModule,
            audit_module_1.AuditModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            plans_module_1.PlansModule,
            cashbooks_module_1.CashbooksModule,
            categories_module_1.CategoriesModule,
            transactions_module_1.TransactionsModule,
            passbook_module_1.PassbookModule,
            budgets_module_1.BudgetsModule,
            goals_module_1.GoalsModule,
            analytics_module_1.AnalyticsModule,
            currency_module_1.CurrencyModule,
            notifications_module_1.NotificationsModule,
            uploads_module_1.UploadsModule,
            support_module_1.SupportModule,
            admin_module_1.AdminModule,
            scheduler_module_1.SchedulerModule,
            export_module_1.ExportModule,
            app_config_module_1.AppConfigModule,
        ],
        providers: [
            { provide: core_1.APP_GUARD, useClass: throttler_2.ThrottlerGuard },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map