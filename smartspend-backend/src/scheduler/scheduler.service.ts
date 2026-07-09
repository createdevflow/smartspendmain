import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CurrencyService } from '../currency/currency.service';
import { CommunicationService } from '../communication/communication.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationCategory } from '@prisma/client';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private currency: CurrencyService,
    private communication: CommunicationService,
    private notifications: NotificationsService,
  ) {}

  // ── Existing Cron Jobs ────────────────────────────────────────────────────

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

  @Cron('0 3 * * *') // EVERY_DAY_AT_3AM
  async cleanupOldNotifications() {
    this.logger.log('Running scheduled task: cleanupOldNotifications');
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const result = await this.prisma.notification.deleteMany({
        where: { createdAt: { lt: sevenDaysAgo } },
      });
      this.logger.log(`Cleaned up ${result.count} old notifications`);
    } catch (e) {
      this.logger.error(`cleanupOldNotifications error: ${e.message}`);
    }
  }

  // ── Communication Center Dispatchers ──────────────────────────────────────

  /** Run every minute to dispatch due emails and messages */
  @Cron('* * * * *')
  async dispatchScheduledCommunications() {
    try {
      await Promise.all([
        this.communication.dispatchDueEmails(),
        this.communication.dispatchDueMessages(),
      ]);
    } catch (e) {
      this.logger.error(`Communication dispatch error: ${e.message}`);
    }
  }

  /** Run every hour to dispatch scheduled admin notifications */
  @Cron('0 * * * *')
  async dispatchScheduledAdminNotifications() {
    try {
      await this.communication.dispatchScheduledAdminNotifications();
    } catch (e) {
      this.logger.error(`Admin notification dispatch error: ${e.message}`);
    }
  }

  // ── Budget Alert Notifications ─────────────────────────────────────────────

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendBudgetAlerts() {
    this.logger.log('Running scheduled task: sendBudgetAlerts');
    try {
      const now = new Date();
      const budgets = await this.prisma.budget.findMany({
        where: { isActive: true },
        include: { user: { select: { id: true, email: true } } },
      });

      for (const budget of budgets) {
        try {
          const spentAgg = await this.prisma.transaction.aggregate({
            where: {
              userId: budget.userId,
              type: 'EXPENSE',
              deletedAt: null,
              ...(budget.categoryId ? { categoryId: budget.categoryId } : {}),
              ...(budget.cashbookId ? { cashbookId: budget.cashbookId } : {}),
              date: { gte: budget.startDate, lte: budget.endDate || now },
            },
            _sum: { amountInBookCurrency: true },
          });

          const spent = Number(spentAgg._sum.amountInBookCurrency || 0);
          const total = Number(budget.amount);
          const pct = total > 0 ? Math.round((spent / total) * 100) : 0;

          if (pct >= 100) {
            await this.notifications.createUserNotification(budget.userId, {
              title: '🚨 Budget Exceeded!',
              body: `You have exceeded your budget by ${pct - 100}%. Spent: ₹${spent.toFixed(0)} / Limit: ₹${total.toFixed(0)}`,
              category: NotificationCategory.BUDGET,
              actionUrl: 'cashtro://budgets',
              actionButton: 'View Budget',
            });
          } else if (pct >= 80) {
            await this.notifications.createUserNotification(budget.userId, {
              title: '⚠️ Budget at 80%',
              body: `You've used ${pct}% of your budget. Spent: ₹${spent.toFixed(0)} / Limit: ₹${total.toFixed(0)}`,
              category: NotificationCategory.BUDGET,
              actionUrl: 'cashtro://budgets',
              actionButton: 'View Budget',
            });
          } else if (pct >= 50) {
            await this.notifications.createUserNotification(budget.userId, {
              title: '💡 Budget Halfway Used',
              body: `You've used ${pct}% of your budget. ₹${(total - spent).toFixed(0)} remaining.`,
              category: NotificationCategory.BUDGET,
              actionUrl: 'cashtro://budgets',
            });
          }
        } catch (e) {
          this.logger.warn(`Budget alert failed for budget ${budget.id}: ${e.message}`);
        }
      }
    } catch (e) {
      this.logger.error(`sendBudgetAlerts error: ${e.message}`);
    }
  }

  // ── Goal Reminder Notifications ────────────────────────────────────────────

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendGoalReminders() {
    this.logger.log('Running scheduled task: sendGoalReminders');
    try {
      const now = new Date();
      const sevenDaysFromNow = new Date(now);
      sevenDaysFromNow.setDate(now.getDate() + 7);

      const goals = await this.prisma.goal.findMany({
        where: {
          status: 'ACTIVE',
          deadline: { lte: sevenDaysFromNow, gte: now },
        },
      });

      for (const goal of goals) {
        const daysLeft = Math.ceil((new Date(goal.deadline!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        await this.notifications.createUserNotification(goal.userId, {
          title: '🎯 Goal Deadline Approaching',
          body: `Your goal "${goal.name}" is due in ${daysLeft} day${daysLeft === 1 ? '' : 's'}! Keep saving!`,
          category: NotificationCategory.GOAL,
          actionUrl: 'cashtro://goals',
          actionButton: 'View Goal',
        });
      }
    } catch (e) {
      this.logger.error(`sendGoalReminders error: ${e.message}`);
    }
  }
}
