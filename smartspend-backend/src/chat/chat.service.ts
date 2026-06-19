import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContactStatus, ConversationType, MessageType } from '@prisma/client';
import { SendMessageDto, CreateConversationDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
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

    return msg;
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
}
