import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MediaService } from '../media/media.service';
import { ContactStatus, ConversationType, MessageType } from '@prisma/client';
import { SendMessageDto, CreateConversationDto } from './dto/chat.dto';
import { Expo } from 'expo-server-sdk';
import { AiService } from '../ai/ai.service';
import { TransactionsService } from '../transactions/transactions.service';

@Injectable()
export class ChatService {
  private expo = new Expo();

  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
    private readonly aiService: AiService,
    private readonly transactionsService: TransactionsService,
  ) {}

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

    const reversed = messages.reverse();
    return Promise.all(reversed.map(m => this.sanitizeMessageMedia(m)));
  }

  // ── Messages ──────────────────────────────────────────────────────────────

  async createMessage(senderId: string, dto: SendMessageDto) {
    const member = await this.prisma.chatMember.findUnique({
      where: { conversationId_userId: { conversationId: dto.conversationId, userId: senderId } },
    });
    if (!member) throw new ForbiddenException('Not a member');

    const sanitized = await this.sanitizeMessageMedia({
      content: dto.content,
      mediaUrl: dto.mediaUrl,
      metadata: dto.metadata,
      senderId,
    });

    const msg = await this.prisma.chatMessage.create({
      data: {
        conversationId: dto.conversationId,
        senderId,
        type: dto.type,
        content: sanitized.content,
        mediaUrl: sanitized.mediaUrl,
        metadata: sanitized.metadata,
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

    const msgs = await this.prisma.chatMessage.findMany({
      where: { conversationId, deletedAt: null, ...filter },
      include: { sender: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return Promise.all(msgs.map(m => this.sanitizeMessageMedia(m)));
  }

  private async sanitizeMessageMedia(msg: any): Promise<any> {
    if (!msg) return msg;
    let needsUpdate = false;
    let newContent = msg.content;
    let newMediaUrl = msg.mediaUrl;
    let newMetadata = msg.metadata ? (typeof msg.metadata === 'object' ? { ...msg.metadata } : msg.metadata) : {};

    if (newContent && typeof newContent === 'string' && (newContent.startsWith('data:') || newContent.length > 500)) {
      try {
        const res = await this.mediaService.uploadBase64(newContent, { module: 'chat', ownerId: msg.senderId });
        newMediaUrl = res.url;
        newContent = '';
        if (typeof newMetadata === 'object') {
          newMetadata.id = res.id;
          newMetadata.size = res.size;
        }
        needsUpdate = true;
      } catch (e) {}
    }

    if (newMediaUrl && typeof newMediaUrl === 'string' && (newMediaUrl.startsWith('data:') || newMediaUrl.length > 500)) {
      try {
        const res = await this.mediaService.uploadBase64(newMediaUrl, { module: 'chat', ownerId: msg.senderId });
        newMediaUrl = res.url;
        if (typeof newMetadata === 'object') {
          newMetadata.id = res.id;
          newMetadata.size = res.size;
          newMetadata.uri = res.url;
        }
        needsUpdate = true;
      } catch (e) {}
    }

    if (newMetadata && typeof newMetadata === 'object' && newMetadata.uri && typeof newMetadata.uri === 'string' && (newMetadata.uri.startsWith('data:') || newMetadata.uri.length > 500)) {
      try {
        const res = await this.mediaService.uploadBase64(newMetadata.uri, { module: 'chat', ownerId: msg.senderId });
        newMetadata.uri = res.url;
        newMetadata.id = res.id;
        newMetadata.size = res.size;
        if (!newMediaUrl) newMediaUrl = res.url;
        needsUpdate = true;
      } catch (e) {}
    }

    if (needsUpdate && msg.id) {
      msg.content = newContent;
      msg.mediaUrl = newMediaUrl;
      msg.metadata = newMetadata;
      this.prisma.chatMessage.update({
        where: { id: msg.id },
        data: { content: newContent, mediaUrl: newMediaUrl, metadata: newMetadata },
      }).catch(() => {});
    }

    return msg;
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

    const cur = cashbook.currency || 'INR';
    const sym = cur === 'INR' || cur === '₹' ? '₹' : cur === 'USD' ? '$' : cur === 'EUR' ? '€' : cur === 'GBP' ? '£' : cur;

    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const txs = await this.prisma.transaction.findMany({
      where: { cashbookId, deletedAt: null, date: { gte: thirtyDaysAgo } },
      include: { category: true }
    });

    if (txs.length === 0) {
      return { insight: `Track your expenses in ${cur} to receive smart AI-powered financial insights here!` };
    }

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals: Record<string, number> = {};

    txs.forEach((tx: any) => {
      const amount = parseFloat(tx.amount.toString());
      const catName = tx.category?.name || 'Uncategorized';
      if (tx.type === 'INCOME') totalIncome += amount;
      else {
        totalExpense += amount;
        categoryTotals[catName] = (categoryTotals[catName] || 0) + amount;
      }
    });

    const sortedCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([cat, amt]) => `${cat}: ${sym}${amt.toLocaleString('en-IN')}`)
      .join(', ');

    const prompt = `User's last 30 days financial data (Currency: ${cur} (${sym})):
- Total Income: ${sym}${totalIncome.toLocaleString('en-IN')}
- Total Expense: ${sym}${totalExpense.toLocaleString('en-IN')}
- Top Expense Categories: ${sortedCategories || 'None'}

Provide a single, short, highly analytical and personalized insight (max 2 sentences). Do not use generic phrases like "You're off to a strong start". Focus on the numbers, ratios, or specific categories.
CRITICAL: You MUST use the currency symbol '${sym}' (or '${cur}') when referring to any monetary amounts. NEVER use '$' unless the currency is explicitly USD.`;

    const systemInstruction = `You are an elite financial analyst providing short, sharp, and highly analytical insights based strictly on the provided financial data. Always use the user's currency '${sym}' (${cur}). Keep it under 25 words if possible.`;

    try {
      const aiRes = await this.aiService.generateContent({
        userId,
        feature: 'MINI_INSIGHT',
        prompt,
        systemInstruction,
      });
      const rawPayload = aiRes?.data !== undefined ? aiRes.data : aiRes;
      let insight = typeof rawPayload === 'string' ? rawPayload : rawPayload?.text || rawPayload?.content || "You're off to a strong start!";
      insight = insight.replace(/^["']|["']$/g, '').trim();
      if (sym !== '$' && insight.includes('$')) {
        insight = insight.replace(/\$/g, sym);
      }
      return { insight };
    } catch (e) {
      console.error('Failed to generate mini insight', e);
      return { insight: `Your AI-powered ${cur} financial insight is currently unavailable. Check back later!` };
    }
  }

  // ── AI Notes ──────────────────────────────────────────────────────────────

  async analyzeNoteMessage(messageId: string, userId: string) {
    const msg = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: { conversation: true },
    });
    if (!msg || msg.senderId !== userId) throw new NotFoundException('Message not found');
    
    // Only analyze text messages in NOTES_SELF or My Notes
    if (msg.type !== 'TEXT' || !msg.content) {
      throw new BadRequestException('Can only analyze text messages');
    }
    
    const isNotes = msg.conversation.type === 'NOTES_SELF' || msg.conversation.name === 'My Notes';
    if (!isNotes) {
      throw new BadRequestException('Can only analyze notes');
    }

    const systemInstruction = `You are a financial AI assistant inside the "My Notes" workspace. Analyze the provided note text.
Return a valid JSON object matching this schema:
{
  "isActionable": boolean, // true if there is a clear action to take
  "summary": string, // short 1-sentence summary
  "transactions": [
    { "type": "INCOME"|"EXPENSE", "amount": number, "merchant": string, "date": "YYYY-MM-DD" }
  ],
  "tasks": [
    { "task": string, "dueDate": "YYYY-MM-DD" }
  ],
  "budgets": [
    { "category": string, "limit": number }
  ],
  "goals": [
    { "name": string, "targetAmount": number }
  ],
  "tags": [string],
  "categories": [string]
}
If any array is empty, return []. Ensure valid JSON.`;

    try {
      const aiRes = await this.aiService.generateContent({
        userId,
        feature: 'NOTE_ANALYSIS',
        prompt: msg.content,
        systemInstruction,
        expectedJson: true,
      });

      let aiAnalysis = aiRes?.data !== undefined ? aiRes.data : aiRes;
      if (typeof aiAnalysis === 'string') {
        try {
          aiAnalysis = JSON.parse(aiAnalysis);
        } catch (e) {
          throw new BadRequestException('AI returned invalid JSON');
        }
      }
      if (!aiAnalysis || typeof aiAnalysis !== 'object') {
        aiAnalysis = { isActionable: false, summary: "Note logged and indexed for AI search.", transactions: [], tasks: [], budgets: [], goals: [], tags: [], categories: [] };
      }

      const existingMeta = (msg.metadata as any) || {};
      const updatedMeta = { ...existingMeta, aiAnalysis };

      const updatedMsg = await this.prisma.chatMessage.update({
        where: { id: messageId },
        data: { metadata: updatedMeta },
        include: { sender: { select: { id: true, fullName: true, avatar: true } } },
      });

      // ── AUTOMATICALLY REGISTER TO DESIRED DESTINATIONS IN DATABASE ───────
      let cashbookId = (msg.metadata as any)?.cashbookId;
      if (!cashbookId) {
        const cb = await this.prisma.cashbook.findFirst({
          where: {
            deletedAt: null,
            OR: [{ userId }, { members: { some: { userId, status: 'accepted' } } }],
          },
          orderBy: { isDefault: 'desc' },
        });
        if (cb) cashbookId = cb.id;
      }
      if (!cashbookId) {
        const newCb = await this.prisma.cashbook.create({
          data: { userId, name: 'General Cashbook', currency: 'INR', isDefault: true },
        });
        cashbookId = newCb.id;
      }

      if (aiAnalysis.transactions?.length) {
        for (const tx of aiAnalysis.transactions) {
          if (tx && tx.amount) {
            try {
              let categoryId: string | undefined = undefined;
              if (tx.category) {
                const cat = await this.prisma.category.findFirst({
                  where: {
                    OR: [
                      { name: { equals: tx.category, mode: 'insensitive' } },
                      { name: { contains: tx.category, mode: 'insensitive' } },
                    ],
                  },
                });
                if (cat) categoryId = cat.id;
              }

              await this.transactionsService.create(userId, {
                cashbookId,
                amount: parseFloat(tx.amount) || 0,
                currency: 'INR',
                type: tx.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
                date: new Date().toISOString(),
                categoryId,
                merchant: tx.merchant || 'AI Note Entry',
                notes: msg.content,
                paymentMethod: 'cash',
                tags: tx.category ? [tx.category] : [],
              } as any);
            } catch (e) {
              // Ignore duplicate or failed transaction creation
            }
          }
        }
      }

      if (aiAnalysis.tasks?.length) {
        for (const t of aiAnalysis.tasks) {
          if (t && t.task) {
            try {
              let remindAt = new Date();
              remindAt.setDate(remindAt.getDate() + 1);
              remindAt.setHours(9, 0, 0, 0);
              if (t.dueDate && !isNaN(new Date(t.dueDate).getTime())) {
                remindAt = new Date(t.dueDate);
              }
              await this.prisma.messageReminder.create({
                data: {
                  userId,
                  messageId: msg.id,
                  remindAt,
                  note: t.task,
                },
              });
            } catch (e) {}
          }
        }
      }

      if (aiAnalysis.budgets?.length) {
        for (const b of aiAnalysis.budgets) {
          if (b && (b.amount || b.limit || b.name)) {
            try {
              const amount = parseFloat(b.amount || b.limit) || 1000;
              const name = b.name || b.category || 'Monthly Budget';
              let categoryId: string | undefined = undefined;
              if (b.category) {
                const cat = await this.prisma.category.findFirst({
                  where: { name: { equals: b.category, mode: 'insensitive' } },
                });
                if (cat) categoryId = cat.id;
              }
              await this.prisma.budget.create({
                data: {
                  userId,
                  name,
                  amount,
                  currency: 'INR',
                  period: 'MONTHLY',
                  startDate: new Date(),
                  categoryId,
                },
              });
            } catch (e) {}
          }
        }
      }

      if (aiAnalysis.goals?.length) {
        for (const g of aiAnalysis.goals) {
          if (g && (g.targetAmount || g.name)) {
            try {
              const targetAmount = parseFloat(g.targetAmount) || 10000;
              const name = g.name || 'Savings Goal';
              await this.prisma.goal.create({
                data: {
                  userId,
                  name,
                  targetAmount,
                  currentAmount: parseFloat(g.currentAmount) || 0,
                  currency: 'INR',
                },
              });
            } catch (e) {}
          }
        }
      }

      let replyContent = `🤖 **AI Assistant Insight**\n`;
      if (aiAnalysis.summary) {
        replyContent += `${aiAnalysis.summary}\n\n`;
      }
      const actions: string[] = [];
      if (aiAnalysis.transactions?.length) {
        actions.push(`✅ Recorded ${aiAnalysis.transactions.length} transaction(s): ` + aiAnalysis.transactions.map((t: any) => `${t.type === 'INCOME' ? '+' : '-'}${t.amount} (${t.merchant || 'General'})`).join(', '));
      }
      if (aiAnalysis.tasks?.length) {
        actions.push(`📋 Created ${aiAnalysis.tasks.length} task(s): ` + aiAnalysis.tasks.map((t: any) => `${t.task}${t.dueDate ? ' (due ' + t.dueDate + ')' : ''}`).join(', '));
      }
      if (aiAnalysis.budgets?.length) {
        actions.push(`💰 Updated ${aiAnalysis.budgets.length} budget limit(s)`);
      }
      if (aiAnalysis.goals?.length) {
        actions.push(`🎯 Tracked ${aiAnalysis.goals.length} goal target(s)`);
      }
      if (actions.length > 0) {
        replyContent += actions.join('\n');
      } else if (!aiAnalysis.isActionable && !aiAnalysis.summary) {
        replyContent += `📝 Note logged and indexed for AI search.`;
      }

      const aiReply = await this.prisma.chatMessage.create({
        data: {
          conversationId: msg.conversationId,
          senderId: userId,
          type: 'TEXT',
          content: replyContent.trim(),
          metadata: { isAiBotResponse: true, replyToMessageId: messageId, aiAnalysis: { ...aiAnalysis, autoRegistered: true } },
        },
        include: { sender: { select: { id: true, fullName: true, avatar: true } } },
      });

      return { msg: updatedMsg, aiReply };
    } catch (error) {
      throw new BadRequestException('Failed to analyze note: ' + error.message);
    }
  }

  async executeNoteAction(messageId: string, actionType: string, userId: string) {
    const msg = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
    });
    if (!msg || msg.senderId !== userId || !msg.content) throw new NotFoundException('Message not found');

    let prompt = '';
    let systemInstruction = 'You are an AI assistant. Return only the modified text without markdown blocks unless formatting is requested.';

    switch (actionType) {
      case 'summarize':
        prompt = `Summarize the following note clearly and concisely in bullet points:\n\n${msg.content}`;
        break;
      case 'rewrite':
        prompt = `Rewrite the following note to be professional and well-structured:\n\n${msg.content}`;
        break;
      case 'translate_hindi':
        prompt = `Translate the following note to Hindi while preserving the formatting:\n\n${msg.content}`;
        break;
      case 'translate_spanish':
        prompt = `Translate the following note to Spanish while preserving the formatting:\n\n${msg.content}`;
        break;
      case 'fix_grammar':
        prompt = `Fix any spelling or grammar mistakes in the following note. Keep the same tone:\n\n${msg.content}`;
        break;
      case 'simplify':
        prompt = `Simplify the following note so it's easy to read:\n\n${msg.content}`;
        break;
      case 'expand':
        prompt = `Expand on the following note and provide more detail:\n\n${msg.content}`;
        break;
      default:
        throw new BadRequestException('Invalid action type');
    }

    try {
      const aiRes = await this.aiService.generateContent({
        userId,
        feature: 'NOTE_ACTION',
        prompt,
        systemInstruction,
      });

      const rawPayload = aiRes?.data !== undefined ? aiRes.data : aiRes;
      const transformedContent = typeof rawPayload === 'string' ? rawPayload : rawPayload?.text || rawPayload?.content || prompt;
      
      const updatedMsg = await this.prisma.chatMessage.update({
        where: { id: messageId },
        data: {
          content: transformedContent,
          isEdited: true,
          editedAt: new Date(),
        },
        include: { sender: { select: { id: true, fullName: true, avatar: true } } },
      });

      const aiReply = await this.prisma.chatMessage.create({
        data: {
          conversationId: msg.conversationId,
          senderId: userId,
          type: 'TEXT',
          content: `✨ **AI Agent Execution Insight**\nAction \`${actionType}\` executed on your note successfully!`,
          metadata: { isAiBotResponse: true, replyToMessageId: messageId, actionExecuted: actionType },
        },
        include: { sender: { select: { id: true, fullName: true, avatar: true } } },
      });

      return { msg: updatedMsg, aiReply };
    } catch (error) {
      throw new BadRequestException('Failed to execute action: ' + error.message);
    }
  }
}
