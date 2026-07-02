import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { Expo } from 'expo-server-sdk';

@Injectable()
export class ChatScheduler {
  private readonly logger = new Logger(ChatScheduler.name);
  private expo = new Expo();

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
    private readonly chatService: ChatService,
  ) {}

  // Run every minute to dispatch scheduled chat messages
  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledMessages() {
    const now = new Date();
    const due = await this.prisma.scheduledChatMessage.findMany({
      where: { scheduledAt: { lte: now }, isSent: false },
      include: {
        sender: { select: { id: true, fullName: true, avatar: true } },
      },
    });

    for (const scheduled of due) {
      try {
        const msg = await this.chatService.createMessage(scheduled.senderId, {
          conversationId: scheduled.conversationId,
          type: scheduled.type,
          content: scheduled.content,
          mediaUrl: scheduled.mediaUrl,
          metadata: scheduled.metadata,
        } as any);

        await this.chatGateway.broadcastNewMessage(msg);

        // Handle repeat
        if (scheduled.repeatType !== 'ONCE') {
          const nextDate = new Date(scheduled.scheduledAt);
          if (scheduled.repeatType === 'DAILY') nextDate.setDate(nextDate.getDate() + 1);
          else if (scheduled.repeatType === 'WEEKLY') nextDate.setDate(nextDate.getDate() + 7);
          else if (scheduled.repeatType === 'MONTHLY') nextDate.setMonth(nextDate.getMonth() + 1);

          await this.prisma.scheduledChatMessage.update({
            where: { id: scheduled.id },
            data: { scheduledAt: nextDate, isSent: false },
          });
        } else {
          await this.prisma.scheduledChatMessage.update({
            where: { id: scheduled.id },
            data: { isSent: true },
          });
        }

        this.logger.log(`Dispatched scheduled message ${scheduled.id}`);
      } catch (err) {
        this.logger.error(`Failed to dispatch scheduled message ${scheduled.id}:`, err);
      }
    }
  }

  // Run every minute to fire message reminders as push notifications
  @Cron(CronExpression.EVERY_MINUTE)
  async processMessageReminders() {
    const now = new Date();
    const due = await this.prisma.messageReminder.findMany({
      where: { remindAt: { lte: now }, isSent: false },
      include: {
        user: { select: { expoPushToken: true, pushNotifications: true, fullName: true } },
        message: {
          include: {
            sender: { select: { fullName: true } },
            conversation: { select: { id: true, name: true, type: true } },
          },
        },
      },
    });

    const notifications: any[] = [];
    for (const reminder of due) {
      const user = reminder.user;
      if (user.pushNotifications && user.expoPushToken && Expo.isExpoPushToken(user.expoPushToken)) {
        const senderName = reminder.message.sender?.fullName || 'Someone';
        const convName = reminder.message.conversation?.name || 'Chat';

        notifications.push({
          to: user.expoPushToken,
          sound: 'default' as const,
          title: `🔔 Reminder from ${convName}`,
          body: reminder.note || `${senderName}: ${(reminder.message.content || 'Shared something').substring(0, 80)}`,
          data: {
            conversationId: reminder.message.conversationId,
            messageId: reminder.messageId,
            type: 'MESSAGE_REMINDER',
          },
        });
      }

      await this.prisma.messageReminder.update({
        where: { id: reminder.id },
        data: { isSent: true },
      });
    }

    if (notifications.length > 0) {
      const chunks = this.expo.chunkPushNotifications(notifications as any);
      for (const chunk of chunks) {
        try {
          await this.expo.sendPushNotificationsAsync(chunk);
        } catch (error) {
          this.logger.error('Error sending reminder push notifications:', error);
        }
      }
    }
  }
}
