import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationCategory, NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  // ── User Notifications ───────────────────────────────────────────────────

  async findAll(userId: string, category?: string, page = 1, limit = 30) {
    const skip = (page - 1) * limit;
    const where: any = { userId, isArchived: false };
    if (category && category !== 'ALL') {
      where.category = category as NotificationCategory;
    }
    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false, isArchived: false } }),
    ]);
    return { items, total, unreadCount, page, limit };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false, isArchived: false },
    });
    return { count };
  }

  async markAsRead(userId: string, id: string) {
    return this.prisma.notification.update({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { message: 'All marked as read' };
  }

  async pin(userId: string, id: string) {
    const notif = await this.prisma.notification.findFirst({ where: { id, userId } });
    if (!notif) return;
    return this.prisma.notification.update({
      where: { id },
      data: { isPinned: !notif.isPinned },
    });
  }

  async archive(userId: string, id: string) {
    return this.prisma.notification.update({
      where: { id, userId },
      data: { isArchived: true, isRead: true },
    });
  }

  async remove(userId: string, id: string) {
    await this.prisma.notification.deleteMany({ where: { id, userId } });
    return { message: 'Notification deleted' };
  }

  // ── Preferences ──────────────────────────────────────────────────────────

  async getPreferences(userId: string) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  async updatePreferences(userId: string, dto: any) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto,
    });
  }

  // ── Internal Creators ─────────────────────────────────────────────────────

  /**
   * Creates a notification for a user, respecting their preferences.
   * Also sends Expo push if pushEnabled.
   */
  async createUserNotification(
    userId: string,
    payload: {
      title: string;
      body: string;
      category: NotificationCategory;
      type?: NotificationType;
      data?: any;
      actionUrl?: string;
      imageUrl?: string;
      actionButton?: string;
    },
  ) {
    try {
      // Check user preferences
      const prefs = await this.prisma.notificationPreference.findUnique({ where: { userId } });
      if (prefs) {
        const catKey = (payload.category.toLowerCase() + 'Alerts') as keyof typeof prefs;
        if (prefs[catKey] === false) return null;
        if (!prefs.inAppEnabled) return null;
      }

      const notif = await this.prisma.notification.create({
        data: {
          userId,
          title: payload.title,
          body: payload.body,
          category: payload.category,
          type: payload.type ?? NotificationType.IN_APP,
          data: payload.data,
          actionUrl: payload.actionUrl,
          imageUrl: payload.imageUrl,
          actionButton: payload.actionButton,
          sentAt: new Date(),
        },
      });

      // Send Expo push notification
      if (!prefs || prefs.pushEnabled) {
        await this.sendExpoPush(userId, payload.title, payload.body, payload.actionUrl);
      }

      return notif;
    } catch (e) {
      this.logger.error(`Failed to create notification for user ${userId}: ${e.message}`);
      return null;
    }
  }

  async create(userId: string, title: string, body: string, type: any) {
    return this.prisma.notification.create({ data: { userId, title, body, type } });
  }

  /**
   * Bulk-create notifications (for admin broadcasts).
   */
  async createBulkNotifications(
    userIds: string[],
    payload: {
      title: string;
      body: string;
      category: NotificationCategory;
      type: NotificationType;
      data?: any;
      actionUrl?: string;
      imageUrl?: string;
      actionButton?: string;
    },
  ) {
    if (!userIds.length) return;
    const now = new Date();
    await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        title: payload.title,
        body: payload.body,
        category: payload.category,
        type: payload.type,
        data: payload.data,
        actionUrl: payload.actionUrl,
        imageUrl: payload.imageUrl,
        actionButton: payload.actionButton,
        sentAt: now,
      })),
      skipDuplicates: true,
    });

    // Send Expo push in batches of 100
    const pushUserIds = [...userIds];
    while (pushUserIds.length > 0) {
      const batch = pushUserIds.splice(0, 100);
      await this.sendBulkExpoPush(batch, payload.title, payload.body, payload.actionUrl);
    }
  }

  // ── Expo Push ─────────────────────────────────────────────────────────────

  async sendExpoPush(userId: string, title: string, body: string, actionUrl?: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { expoPushToken: true, pushNotifications: true },
      });
      if (!user?.expoPushToken || !user.pushNotifications) return;

      const devices = await this.prisma.device.findMany({
        where: { userId },
        select: { expoPushToken: true },
      });
      const tokens = [user.expoPushToken, ...devices.map((d) => d.expoPushToken)]
        .filter((t): t is string => typeof t === 'string' && t.startsWith('ExponentPushToken'));

      if (!tokens.length) return;
      await this.sendExpoPushBatch(tokens, title, body, actionUrl);
    } catch (e) {
      this.logger.warn(`Push notification failed for user ${userId}: ${e.message}`);
    }
  }

  private async sendBulkExpoPush(userIds: string[], title: string, body: string, actionUrl?: string) {
    try {
      const users = await this.prisma.user.findMany({
        where: { id: { in: userIds }, pushNotifications: true },
        select: { expoPushToken: true },
      });
      const tokens = users
        .map((u) => u.expoPushToken)
        .filter((t): t is string => typeof t === 'string' && t.startsWith('ExponentPushToken'));
      if (!tokens.length) return;
      await this.sendExpoPushBatch(tokens, title, body, actionUrl);
    } catch (e) {
      this.logger.warn(`Bulk push failed: ${e.message}`);
    }
  }

  private async sendExpoPushBatch(tokens: string[], title: string, body: string, actionUrl?: string) {
    const messages = tokens.map((to) => ({
      to,
      title,
      body,
      sound: 'default',
      data: { actionUrl },
    }));
    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(messages),
      });
      if (!res.ok) {
        this.logger.warn(`Expo push API returned ${res.status}`);
      }
    } catch (e) {
      this.logger.warn(`Expo push batch send failed: ${e.message}`);
    }
  }
}
