import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationCategory, NotificationType } from '@prisma/client';
import { Expo } from 'expo-server-sdk';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly expo = new Expo();

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
      if (!user || user.pushNotifications === false) return;

      const devices = await this.prisma.device.findMany({
        where: { userId },
        select: { expoPushToken: true },
      });
      
      const rawTokens = [user.expoPushToken, ...devices.map((d) => d.expoPushToken)];
      const tokens = Array.from(new Set(
        rawTokens.filter((t): t is string => typeof t === 'string' && Expo.isExpoPushToken(t))
      ));

      if (!tokens.length) return;
      await this.sendExpoPushBatch(tokens, title, body, actionUrl);
    } catch (e: any) {
      this.logger.warn(`Push notification failed for user ${userId}: ${e.message}`);
    }
  }

  private async sendBulkExpoPush(userIds: string[], title: string, body: string, actionUrl?: string) {
    try {
      const users = await this.prisma.user.findMany({
        where: { id: { in: userIds }, NOT: { pushNotifications: false } },
        select: { expoPushToken: true, id: true },
      });
      
      const activeUserIds = users.map((u) => u.id);
      const devices = await this.prisma.device.findMany({
        where: { userId: { in: activeUserIds } },
        select: { expoPushToken: true },
      });

      const rawTokens = [
        ...users.map((u) => u.expoPushToken),
        ...devices.map((d) => d.expoPushToken),
      ];
      const tokens = Array.from(new Set(
        rawTokens.filter((t): t is string => typeof t === 'string' && Expo.isExpoPushToken(t))
      ));

      if (!tokens.length) return;
      await this.sendExpoPushBatch(tokens, title, body, actionUrl);
    } catch (e: any) {
      this.logger.warn(`Bulk push failed: ${e.message}`);
    }
  }

  private async sendExpoPushBatch(tokens: string[], title: string, body: string, actionUrl?: string) {
    const messages = tokens.map((to) => ({
      to,
      sound: 'default' as const,
      title,
      body,
      data: { actionUrl },
    }));
    try {
      const chunks = this.expo.chunkPushNotifications(messages as any[]);
      for (const chunk of chunks) {
        try {
          await this.expo.sendPushNotificationsAsync(chunk);
        } catch (error: any) {
          this.logger.warn(`Error sending push chunk: ${error.message}`);
        }
      }
    } catch (e: any) {
      this.logger.warn(`Expo push batch send failed: ${e.message}`);
    }
  }
}
