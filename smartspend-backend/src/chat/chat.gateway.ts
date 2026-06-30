import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { CacheService } from '../cache/cache.service';
import { SendMessageDto, EditMessageDto, ReactMessageDto } from './dto/chat.dto';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSocketMap = new Map<string, Set<string>>(); // userId → socketId[]

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {}

  // ── Connection ────────────────────────────────────────────────────────────

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) { client.disconnect(); return; }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.accessSecret') || process.env.JWT_ACCESS_SECRET || this.configService.get<string>('JWT_SECRET'),
      });

      const userId = payload.sub;
      client.data.userId = userId;

      // Track socket
      if (!this.userSocketMap.has(userId)) {
        this.userSocketMap.set(userId, new Set());
      }
      this.userSocketMap.get(userId)!.add(client.id);

      // Join all user's conversation rooms
      const conversations = await this.chatService.getUserConversations(userId);
      for (const conv of conversations) {
        client.join(`conv:${conv.id}`);
      }

      // Join personal room for direct notifications
      client.join(`user:${userId}`);

      // Mark online in Redis
      await this.cacheService.set(`presence:${userId}`, 'online', 300);

      // Broadcast presence
      this.server.emit('user.presence', { userId, isOnline: true });

      console.log(`[Chat] Connected: ${userId} (${client.id})`);
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (!userId) return;

    const sockets = this.userSocketMap.get(userId);
    if (sockets) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.userSocketMap.delete(userId);
        // Update last seen
        const lastSeen = new Date().toISOString();
        await this.cacheService.set(`lastseen:${userId}`, lastSeen, 86400);
        await this.cacheService.del(`presence:${userId}`);

        this.server.emit('user.presence', {
          userId,
          isOnline: false,
          lastSeenAt: lastSeen,
        });
      }
    }

    console.log(`[Chat] Disconnected: ${userId} (${client.id})`);
  }

  // ── Helper ────────────────────────────────────────────────────────────────

  private emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // ── Message Events ────────────────────────────────────────────────────────

  async broadcastNewMessage(message: any) {
    this.server.to(`conv:${message.conversationId}`).emit('message.new', message);
    try {
      const userIds = await this.chatService.getConversationParticipantIds(message.conversationId);
      for (const uid of userIds) {
        this.server.to(`user:${uid}`).emit('message.new', message);
      }
    } catch {
      // ignore
    }
  }

  private async broadcastEventToConversation(conversationId: string, event: string, payload: any, clientToExclude?: Socket) {
    if (clientToExclude) {
      clientToExclude.to(`conv:${conversationId}`).emit(event, payload);
    } else {
      this.server.to(`conv:${conversationId}`).emit(event, payload);
    }
    try {
      const userIds = await this.chatService.getConversationParticipantIds(conversationId);
      const excludeUid = clientToExclude?.data?.userId;
      for (const uid of userIds) {
        if (excludeUid && uid === excludeUid) continue;
        this.server.to(`user:${uid}`).emit(event, payload);
      }
    } catch {
      // ignore
    }
  }

  @SubscribeMessage('message.send')
  async handleSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const userId = client.data.userId;
    try {
      const message = await this.chatService.createMessage(userId, dto);
      await this.broadcastNewMessage(message);
      return { success: true, message };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  @SubscribeMessage('message.edit')
  async handleEdit(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: EditMessageDto,
  ) {
    const userId = client.data.userId;
    try {
      const message = await this.chatService.editMessage(dto.messageId, userId, dto.content);
      await this.broadcastEventToConversation(message.conversationId, 'message.edited', {
        messageId: message.id,
        conversationId: message.conversationId,
        content: message.content,
        editedAt: message.editedAt,
      });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  @SubscribeMessage('message.delete')
  async handleDelete(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { messageId: string },
  ) {
    const userId = client.data.userId;
    try {
      const message = await this.chatService.deleteMessage(dto.messageId, userId);
      await this.broadcastEventToConversation(message.conversationId, 'message.deleted', {
        messageId: message.id,
        conversationId: message.conversationId,
      });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  @SubscribeMessage('message.react')
  async handleReact(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: ReactMessageDto & { conversationId: string },
  ) {
    const userId = client.data.userId;
    try {
      const result = await this.chatService.reactToMessage(dto.messageId, userId, dto.emoji);
      await this.broadcastEventToConversation(dto.conversationId, 'message.reaction', {
        messageId: dto.messageId,
        conversationId: dto.conversationId,
        userId,
        emoji: dto.emoji,
        removed: result.removed,
      });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  @SubscribeMessage('message.read')
  async handleRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { conversationId: string },
  ) {
    const userId = client.data.userId;
    await this.chatService.markRead(dto.conversationId, userId);
    await this.broadcastEventToConversation(dto.conversationId, 'message.read', {
      conversationId: dto.conversationId,
      userId,
      readAt: new Date().toISOString(),
    });
    return { success: true };
  }

  @SubscribeMessage('user.typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { conversationId: string; isTyping: boolean },
  ) {
    const userId = client.data.userId;
    // Broadcast to other members (not back to sender)
    await this.broadcastEventToConversation(dto.conversationId, 'user.typing', {
      conversationId: dto.conversationId,
      userId,
      isTyping: dto.isTyping,
    }, client);
    return { success: true };
  }

  // ── Contact Request Events ────────────────────────────────────────────────

  @SubscribeMessage('contact.request')
  async handleContactRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { toUserId: string },
  ) {
    const fromUserId = client.data.userId;
    try {
      const req = await this.chatService.sendContactRequest(fromUserId, dto.toUserId);

      // Notify target user if online
      this.emitToUser(dto.toUserId, 'contact.request', {
        requestId: req.id,
        fromUserId,
      });

      return { success: true, request: req };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  @SubscribeMessage('contact.accept')
  async handleContactAccept(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { requestId: string },
  ) {
    const userId = client.data.userId;
    try {
      const req = await this.chatService.respondToRequest(dto.requestId, userId, true);

      // Create a direct conversation automatically
      const conv = await this.chatService.getOrCreateDirectConversation(req.fromUserId, req.toUserId);

      // Join both users to the conversation room
      client.join(`conv:${conv.id}`);

      // Notify the requester
      this.emitToUser(req.fromUserId, 'contact.accepted', {
        userId,
        conversationId: conv.id,
      });

      // Both users join the conversation room
      const requesterSockets = this.userSocketMap.get(req.fromUserId);
      if (requesterSockets) {
        for (const socketId of requesterSockets) {
          const requesterSocket = this.server.sockets.sockets.get(socketId);
          requesterSocket?.join(`conv:${conv.id}`);
        }
      }

      return { success: true, conversationId: conv.id };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // ── Public method to emit from REST controllers ───────────────────────────

  emitToConversation(conversationId: string, event: string, data: any) {
    this.server.to(`conv:${conversationId}`).emit(event, data);
  }
}
