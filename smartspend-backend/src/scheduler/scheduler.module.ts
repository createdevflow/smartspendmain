import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { CurrencyModule } from '../currency/currency.module';
import { CommunicationModule } from '../communication/communication.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [CurrencyModule, CommunicationModule, NotificationsModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
