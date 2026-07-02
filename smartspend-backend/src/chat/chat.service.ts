import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContactStatus, ConversationType, MessageType } from '@prisma/client';
import { SendMessageDto, CreateConversationDto } from './dto/chat.dto';
import { Expo } from 'expo-server-sdk';

@Injectable()
export class ChatService {
  private expo = new Expo();

  constructor(private readonly prisma: PrismaService) {}

  // ── Contacts ──────────────────────────────────────────────────────────────

  async sendContactRequest(fromUserId: string, toUserId: string) {
    if (fromUserId === toUserId) throw new BadRequestException('Cannot add yourself');

    const existing = await this.prisma.chatContact.findFirst({
      where: {
        OR: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      },
    });

    if (existing) {
      if (existing.status === ContactStatus.BLOCKED) throw new ForbiddenException('User is blocked');
      if (existing.status === ContactStatus.ACCEPTED) throw new BadRequestException('Already contacts');
      return existing;
    }

    const toUser = await this.prisma.user.findUnique({ where: { id: toUserId }, select: { id: true, fullName: true } });
    if (!toUser) throw new NotFoundException('User not found');

    return this.prisma.chatContact.create({
      data: { fromUserId, toUserId, status: ContactStatus.PENDING },
    });
  }

  async respondToRequest(requestId: string, userId: string, accept: boolean) {
    const req = await this.prisma.chatContact.findUnique({ where: { id: requestId } });
    if (!req || req.toUserId !== userId) throw new NotFoundException('Request not found');

    return this.prisma.chatContact.update({
      where: { id: requestId },
      data: { status: accept ? ContactStatus.ACCEPTED : ContactStatus.REJECTED },
    });
  }

  async blockUser(fromUserId: string, toUserId: string) {
    const existing = await this.prisma.chatContact.findFirst({
      where: {
        OR: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      },
    });

    if (existing) {
      return this.prisma.chatContact.update({
        where: { id: existing.id },
        data: { status: ContactStatus.BLOCKED, blockedAt: new Date() },
      });
    }
    return this.prisma.chatContact.create({
      data: { fromUserId, toUserId, status: ContactStatus.BLOCKED, blockedAt: new Date() },
    });
  }

  async getContacts(userId: string) {
    const contacts = await this.prisma.chatContact.findMany({
      where: {
        status: ContactStatus.ACCEPTED,
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      },
      include: {
        fromUser: { select: { id: true, fullName: true, avatar: true } },
        toUser: { select: { id: true, fullName: true, avatar: true } },
      },
    });

    return contacts.map((c) => ({
      id: c.id,
      contact: c.fromUserId === userId ? c.toUser : c.fromUser,
      since: c.updatedAt,
    }));
  }

  async getPendingRequests(userId: string) {
    return this.prisma.chatContact.findMany({
      where: { toUserId: userId, status: ContactStatus.PENDING },
      include: {
        fromUser: { select: { id: true, fullName: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async searchUsers(userId: string, query: string) {
    return this.prisma.user.findMany({
      where: {
        id: { not: userId },
        OR: [
          { fullName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
        status: 'ACTIVE',
      },
      select: { id: true, fullName: true, avatar: true, email: true },
      take: 20,
    });
  }

  // ── Conversations ─────────────────────────────────────────────────────────

  async getOrCreateDirectConversation(userAId: string, userBId: string) {
    // Find existing direct conversation between these two users
    const existing = await this.prisma.chatConversation.findFirst({
      where: {
        type: ConversationType.DIRECT,
        members: {
          every: { userId: { in: [userAId, userBId] } },
        },
        AND: [
          { members: { some: { userId: userAId } } },
          { members: { some: { userId: userBId } } },
        ],
      },
      include: { members: true },
    });

    if (existing && existing.members.length === 2) return existing;

    // Create new direct conversation
    return this.prisma.chatConversation.create({
      data: {
        type: ConversationType.DIRECT,
        members: {
          create: [
            { userId: userAId, role: 'admin' },
            { userId: userBId, role: 'member' },
          ],
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, fullName: true, avatar: true } } },
        },
      },
    });
  }

  async getUserConversations(userId: string) {
    const memberships = await this.prisma.chatMember.findMany({
      where: { userId, isArchived: false },
      include: {
        conversation: {
          include: {
            members: {
              include: { user: { select: { id: true, fullName: true, avatar: true } } },
            },
          },
        },
      },
      orderBy: { conversation: { lastMessageAt: 'desc' } },
    });

    return memberships.map((m) => {
      const conv = m.conversation;
      const otherMembers = conv.members.filter((cm) => cm.userId !== userId);
      const unreadCount = 0; // TODO: compute from lastReadAt vs lastMessageAt

      return {
        id: conv.id,
        type: conv.type,
        name: conv.type === ConversationType.DIRECT
          ? otherMembers[0]?.user?.fullName
          : conv.name,
        avatar: conv.type === ConversationType.DIRECT
          ? otherMembers[0]?.user?.avatar
          : conv.avatar,
        lastMessageText: conv.lastMessageText,
        lastMessageAt: conv.lastMessageAt,
        unreadCount,
        isMuted: m.isMuted,
        isPinned: m.isPinned,
        members: conv.members.map((cm) => ({ userId: cm.userId, user: cm.user, role: cm.role })),
      };
    });
  }

  async getMessages(conversationId: string, userId: string, cursor?: string, limit = 30) {
    // Verify user is a member
    const member = await this.prisma.chatMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this conversation');

    const messages = await this.prisma.chatMessage.findMany({
      where: {
        conversationId,
        deletedAt: null,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      include: {
        sender: { select: { id: true, fullName: true, avatar: true } },
        reactions: {
          include: { user: { select: { id: true, fullName: true } } },
        },
        readBy: { select: { userId: true, readAt: true } },
        replyTo: {
          select: {
            id: true, content: true, type: true,
            sender: { select: { fullName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return messages.reverse();
  }

  // ── Messages ──────────────────────────────────────────────────────────────

  async createMessage(senderId: string, dto: SendMessageDto) {
    const member = await this.prisma.chatMember.findUnique({
      where: { conversationId_userId: { conversationId: dto.conversationId, userId: senderId } },
    });
    if (!member) throw new ForbiddenException('Not a member');

    const msg = await this.prisma.chatMessage.create({
      data: {
        conversationId: dto.conversationId,
        senderId,
        type: dto.type,
        content: dto.content,
        mediaUrl: dto.mediaUrl,
        metadata: dto.metadata,
        replyToId: dto.replyToId,
      },
      include: {
        sender: { select: { id: true, fullName: true, avatar: true } },
        replyTo: {
          select: {
            id: true, content: true, type: true,
            sender: { select: { fullName: true } },
          },
        },
      },
    });

    // Update conversation preview
    const preview = dto.type === MessageType.TEXT
      ? (dto.content || '').substring(0, 100)
      : `📎 ${dto.type.toLowerCase()}`;

    await this.prisma.chatConversation.update({
      where: { id: dto.conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessageText: preview,
      },
    });

    // Fire & forget push notifications
    this.sendPushNotificationForMessage(msg).catch(err => {
      console.error('[Push Notification Error]', err);
    });

    return msg;
  }

  private async sendPushNotificationForMessage(msg: any) {
    const participants = await this.prisma.chatMember.findMany({
      where: { conversationId: msg.conversationId, userId: { not: msg.senderId } },
      include: {
        user: {
          select: { expoPushToken: true, pushNotifications: true, id: true }
        }
      }
    });

    const messages: any[] = [];
    for (const member of participants) {
      const user = member.user;
      if (user.pushNotifications && user.expoPushToken && Expo.isExpoPushToken(user.expoPushToken)) {
        let body = msg.content;
        if (msg.type === MessageType.TRANSACTION) body = 'Shared a transaction with you.';
        else if (msg.type === MessageType.IMAGE) body = 'Sent a photo.';
        else if (msg.type === MessageType.DOCUMENT) body = 'Sent a document.';
        else if (msg.type === MessageType.VOICE) body = 'Sent a voice note.';
        else if (msg.type === MessageType.RECEIPT) body = 'Shared a receipt.';

        messages.push({
          to: user.expoPushToken,
          sound: 'default',
          title: msg.sender.fullName || 'New Message',
          body,
          data: { conversationId: msg.conversationId, messageId: msg.id },
        });
      }
    }

    if (messages.length > 0) {
      const chunks = this.expo.chunkPushNotifications(messages as any[]);
      for (const chunk of chunks) {
        try {
          await this.expo.sendPushNotificationsAsync(chunk);
        } catch (error) {
          console.error('Error sending push chunk:', error);
        }
      }
    }
  }

  async getConversationParticipantIds(conversationId: string): Promise<string[]> {
    const members = await this.prisma.chatMember.findMany({
      where: { conversationId },
      select: { userId: true },
    });
    return members.map((m) => m.userId);
  }

  async editMessage(messageId: string, senderId: string, newContent: string) {
    const msg = await this.prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!msg || msg.senderId !== senderId) throw new ForbiddenException('Cannot edit');
    if (msg.deletedAt) throw new BadRequestException('Message deleted');

    return this.prisma.chatMessage.update({
      where: { id: messageId },
      data: { content: newContent, isEdited: true, editedAt: new Date() },
    });
  }

  async deleteMessage(messageId: string, senderId: string) {
    const msg = await this.prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!msg || msg.senderId !== senderId) throw new ForbiddenException('Cannot delete');

    return this.prisma.chatMessage.update({
      where: { id: messageId },
      data: { deletedAt: new Date(), content: null },
    });
  }

  async reactToMessage(messageId: string, userId: string, emoji: string) {
    const existing = await this.prisma.chatMessageReaction.findUnique({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
    });

    if (existing) {
      // Toggle off
      await this.prisma.chatMessageReaction.delete({ where: { id: existing.id } });
      return { removed: true, emoji };
    }

    const reaction = await this.prisma.chatMessageReaction.create({
      data: { messageId, userId, emoji },
    });
    return { removed: false, emoji, reaction };
  }

  async markRead(conversationId: string, userId: string) {
    await this.prisma.chatMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });
  }

  async updateMemberSettings(conversationId: string, userId: string, settings: { isMuted?: boolean; isPinned?: boolean; isArchived?: boolean }) {
    return this.prisma.chatMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: settings,
    });
  }

  // ── Star Messages ─────────────────────────────────────────────────────────

  async starMessage(userId: string, messageId: string) {
    return this.prisma.starredMessage.upsert({
      where: { userId_messageId: { userId, messageId } },
      update: {},
      create: { userId, messageId },
    });
  }

  async unstarMessage(userId: string, messageId: string) {
    await this.prisma.starredMessage.deleteMany({ where: { userId, messageId } });
    return { success: true };
  }

  async getStarredMessages(userId: string) {
    const starred = await this.prisma.starredMessage.findMany({
      where: { userId },
      include: {
        message: {
          include: {
            sender: { select: { id: true, fullName: true, avatar: true } },
            conversation: { select: { id: true, name: true, type: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return starred.map((s) => ({ ...s.message, starredAt: s.createdAt }));
  }

  // ── Pin Messages ──────────────────────────────────────────────────────────

  async pinMessage(userId: string, messageId: string, conversationId: string) {
    // Verify user is a member
    const member = await this.prisma.chatMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member');
    return this.prisma.chatMessage.update({ where: { id: messageId }, data: { isPinned: true } });
  }

  async unpinMessage(userId: string, messageId: string, conversationId: string) {
    const member = await this.prisma.chatMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member');
    return this.prisma.chatMessage.update({ where: { id: messageId }, data: { isPinned: false } });
  }

  async getPinnedMessages(conversationId: string, userId: string) {
    const member = await this.prisma.chatMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member');
    return this.prisma.chatMessage.findMany({
      where: { conversationId, isPinned: true, deletedAt: null },
      include: { sender: { select: { id: true, fullName: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Scheduled Messages ────────────────────────────────────────────────────

  async scheduleMessage(senderId: string, dto: {
    conversationId: string;
    type: MessageType;
    content?: string;
    mediaUrl?: string;
    metadata?: any;
    scheduledAt: Date;
    repeatType?: string;
  }) {
    const member = await this.prisma.chatMember.findUnique({
      where: { conversationId_userId: { conversationId: dto.conversationId, userId: senderId } },
    });
    if (!member) throw new ForbiddenException('Not a member');

    return this.prisma.scheduledChatMessage.create({
      data: {
        senderId,
        conversationId: dto.conversationId,
        type: dto.type,
        content: dto.content,
        mediaUrl: dto.mediaUrl,
        metadata: dto.metadata,
        scheduledAt: new Date(dto.scheduledAt),
        repeatType: (dto.repeatType as any) ?? 'ONCE',
      },
    });
  }

  async getScheduledMessages(conversationId: string, userId: string) {
    const member = await this.prisma.chatMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member');
    return this.prisma.scheduledChatMessage.findMany({
      where: { conversationId, senderId: userId, isSent: false },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async cancelScheduledMessage(id: string, userId: string) {
    const scheduled = await this.prisma.scheduledChatMessage.findUnique({ where: { id } });
    if (!scheduled || scheduled.senderId !== userId) throw new ForbiddenException('Cannot cancel');
    await this.prisma.scheduledChatMessage.delete({ where: { id } });
    return { success: true };
  }

  // ── Message Reminders ─────────────────────────────────────────────────────

  async addMessageReminder(userId: string, messageId: string, remindAt: Date, note?: string) {
    return this.prisma.messageReminder.create({
      data: { userId, messageId, remindAt: new Date(remindAt), note },
    });
  }

  async getMessageReminders(userId: string) {
    return this.prisma.messageReminder.findMany({
      where: { userId, isSent: false },
      include: {
        message: {
          include: {
            sender: { select: { id: true, fullName: true } },
            conversation: { select: { id: true, name: true, type: true } },
          },
        },
      },
      orderBy: { remindAt: 'asc' },
    });
  }

  // ── Notes to Self ─────────────────────────────────────────────────────────

  async getOrCreateNotesConversation(userId: string) {
    const existing = await this.prisma.chatConversation.findFirst({
      where: {
        type: 'NOTES_SELF' as any,
        members: { some: { userId } },
      },
      include: { members: true },
    });
    if (existing) return existing;

    return this.prisma.chatConversation.create({
      data: {
        type: 'NOTES_SELF' as any,
        name: 'My Notes',
        members: { create: [{ userId, role: 'admin' }] },
      },
      include: { members: true },
    });
  }

  // ── Forward Message ───────────────────────────────────────────────────────

  async forwardMessage(messageId: string, targetConversationIds: string[], userId: string) {
    const original = await this.prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!original) throw new NotFoundException('Message not found');

    const results: any[] = [];
    for (const convId of targetConversationIds) {
      const member = await this.prisma.chatMember.findUnique({
        where: { conversationId_userId: { conversationId: convId, userId } },
      });
      if (!member) continue;

      const fwd = await this.prisma.chatMessage.create({
        data: {
          conversationId: convId,
          senderId: userId,
          type: original.type,
          content: original.content,
          mediaUrl: original.mediaUrl,
          metadata: original.metadata ?? undefined,
          forwardedFromId: messageId,
        },
        include: { sender: { select: { id: true, fullName: true, avatar: true } } },
      });

      await this.prisma.chatConversation.update({
        where: { id: convId },
        data: { lastMessageAt: new Date(), lastMessageText: '↩ Forwarded message' },
      });

      results.push(fwd as any);
    }
    return results;
  }

  // ── Category & Notif Pref ─────────────────────────────────────────────────

  async updateChatCategory(conversationId: string, userId: string, category: string) {
    return this.prisma.chatMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { category: category as any },
    });
  }

  async updateNotifPref(conversationId: string, userId: string, notifPref: string) {
    return this.prisma.chatMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { isMuted: notifPref === 'MUTE' || notifPref === 'SILENT', notifPref: notifPref as any },
    });
  }

  // ── Media Gallery ─────────────────────────────────────────────────────────

  async getMediaGallery(conversationId: string, userId: string, mediaType: string) {
    const member = await this.prisma.chatMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member');

    const typeFilters: Record<string, any> = {
      images: { type: MessageType.IMAGE },
      documents: { type: MessageType.DOCUMENT },
      receipts: { type: MessageType.RECEIPT },
      transactions: { type: MessageType.TRANSACTION },
      voice: { type: MessageType.VOICE },
    };

    const filter = typeFilters[mediaType] || {};

    return this.prisma.chatMessage.findMany({
      where: { conversationId, deletedAt: null, ...filter },
      include: { sender: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  // ── Mini AI Insight ───────────────────────────────────────────────────────
  
  async getMiniInsight(userId: string, cashbookId: string) {
    const cashbook = await this.prisma.cashbook.findFirst({
      where: {
        id: cashbookId,
        deletedAt: null,
        OR: [{ userId }, { members: { some: { userId, status: 'accepted' } } }]
      }
    });
    if (!cashbook) throw new NotFoundException('Cashbook not found');

    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(now.getDate() - 14);

    const [thisWeekTxs, lastWeekTxs] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { cashbookId, deletedAt: null, type: 'EXPENSE', date: { gte: sevenDaysAgo } }
      }),
      this.prisma.transaction.findMany({
        where: { cashbookId, deletedAt: null, type: 'EXPENSE', date: { gte: fourteenDaysAgo, lt: sevenDaysAgo } }
      })
    ]);

    const thisWeekTotal = thisWeekTxs.reduce((sum, tx) => sum + parseFloat(tx.amount.toString()), 0);
    const lastWeekTotal = lastWeekTxs.reduce((sum, tx) => sum + parseFloat(tx.amount.toString()), 0);

    if (lastWeekTotal === 0 && thisWeekTotal === 0) {
      return { insight: "Track your expenses to receive smart financial insights here!" };
    }

    if (lastWeekTotal === 0) {
      return { insight: "You're off to a strong start this week! Keep tracking those expenses." };
    }

    const diffPct = Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100);

    if (diffPct < 0) {
      return { insight: `Great job! You've spent ${Math.abs(diffPct)}% less this week compared to last week.` };
    } else if (diffPct > 0) {
      return { insight: `Watch out! Your spending is up ${diffPct}% this week. Try to stick to your budget!` };
    } else {
      return { insight: "Your spending this week is exactly on track with last week." };
    }
  }
}
