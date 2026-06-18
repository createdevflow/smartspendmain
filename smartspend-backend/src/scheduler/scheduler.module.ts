import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { CurrencyModule } from '../currency/currency.module';

@Module({ imports: [CurrencyModule], providers: [SchedulerService] })
export class SchedulerModule {}
