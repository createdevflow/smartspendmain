import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CurrencyService } from '../currency/currency.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private currency: CurrencyService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async refreshExchangeRates() {
    this.logger.log('Running scheduled task: refreshExchangeRates');
    await this.currency.refreshRates();
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredSessions() {
    this.logger.log('Running scheduled task: cleanupExpiredSessions');
    const result = await this.prisma.session.deleteMany({
      where: { OR: [{ isValid: false }, { expiresAt: { lt: new Date() } }] },
    });
    this.logger.log(`Cleaned up ${result.count} expired/invalid sessions`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupExpiredOtps() {
    this.logger.log('Running scheduled task: cleanupExpiredOtps');
    const result = await this.prisma.otpToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    this.logger.log(`Cleaned up ${result.count} expired OTPs`);
  }
}
