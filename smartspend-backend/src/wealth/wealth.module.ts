// src/wealth/wealth.module.ts
import { Module } from '@nestjs/common';
import { WealthController } from './wealth.controller';
import { WealthService } from './wealth.service';
import { MarketDataService } from './market-data/market-data.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CacheModule } from '../cache/cache.module';
import { AlertsScheduler } from './alerts.scheduler';

@Module({
  imports: [PrismaModule, CacheModule],
  controllers: [WealthController],
  providers: [WealthService, MarketDataService, AlertsScheduler],
  exports: [WealthService, MarketDataService],
})
export class WealthModule {}
