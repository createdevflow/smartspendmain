import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

import configuration from './config/configuration';
import { validationSchema } from './config/validation.schema';

import { PrismaModule } from './prisma/prisma.module';
import { CacheModule } from './cache/cache.module';
import { CryptoModule } from './crypto/crypto.module';
import { MailModule } from './mail/mail.module';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PlansModule } from './plans/plans.module';
import { CashbooksModule } from './cashbooks/cashbooks.module';
import { CategoriesModule } from './categories/categories.module';
import { TransactionsModule } from './transactions/transactions.module';
import { PassbookModule } from './passbook/passbook.module';
import { BudgetsModule } from './budgets/budgets.module';
import { GoalsModule } from './goals/goals.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { CurrencyModule } from './currency/currency.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UploadsModule } from './uploads/uploads.module';
import { SupportModule } from './support/support.module';
import { AdminModule } from './admin/admin.module';
import { AuditModule } from './audit/audit.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { ExportModule } from './export/export.module';
import { AppConfigModule } from './app-config/app-config.module';
import { MaintenanceMiddleware } from './common/middleware/maintenance.middleware';

@Module({
  imports: [
    // ── Config ──────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      validationOptions: { allowUnknown: true, abortEarly: false },
    }),

    // ── Rate Limiting ────────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'short',
            ttl: config.get<number>('THROTTLE_TTL', 60) * 1000,
            limit: config.get<number>('THROTTLE_LIMIT', 100),
          },
        ],
      }),
    }),

    // ── Scheduling ───────────────────────────────────────────────
    ScheduleModule.forRoot(),

    // ── Core ─────────────────────────────────────────────────────
    PrismaModule,
    CacheModule,
    CryptoModule,
    MailModule,
    AuditModule,

    // ── Feature Modules ──────────────────────────────────────────
    AuthModule,
    UsersModule,
    PlansModule,
    CashbooksModule,
    CategoriesModule,
    TransactionsModule,
    PassbookModule,
    BudgetsModule,
    GoalsModule,
    AnalyticsModule,
    CurrencyModule,
    NotificationsModule,
    UploadsModule,
    SupportModule,
    AdminModule,
    SchedulerModule,
    ExportModule,
    AppConfigModule,
  ],
  providers: [
    // Global rate limiter
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply maintenance middleware to all API routes
    consumer
      .apply(MaintenanceMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
