import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request, BadRequestException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { SendMessageDto, CreateConversationDto, SendContactRequestDto } from './dto/chat.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@ApiTags('chat')
@ApiBearerAuth('JWT')
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  // ── Contacts ────────────────────────────────────────────────────────

  @Get('contacts')
  getContacts(@Request() req) {
    return this.chatService.getContacts(req.user.sub);
  }

  @Get('contacts/requests')
  getPendingRequests(@Request() req) {
    return this.chatService.getPendingRequests(req.user.sub);
  }

  @Get('contacts/search')
  searchUsers(@Request() req, @Query('q') q: string) {
    return this.chatService.searchUsers(req.user.sub, q || '');
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 contact requests per minute
  @Post('contacts/request')
  sendContactRequest(@Request() req, @Body() dto: SendContactRequestDto) {
    return this.chatService.sendContactRequest(req.user.sub, dto.toUserId);
  }

  @Patch('contacts/:id/accept')
  acceptRequest(@Request() req, @Param('id') id: string) {
    return this.chatService.respondToRequest(id, req.user.sub, true);
  }

  @Patch('contacts/:id/reject')
  rejectRequest(@Request() req, @Param('id') id: string) {
    return this.chatService.respondToRequest(id, req.user.sub, false);
  }

  @Patch('contacts/:userId/block')
  blockUser(@Request() req, @Param('userId') userId: string) {
    return this.chatService.blockUser(req.user.sub, userId);
  }

  // ── Conversations ────────────────────────────────────────────────────

  @Get('conversations')
  getConversations(@Request() req) {
    return this.chatService.getUserConversations(req.user.sub);
  }

  @Post('conversations')
  async createConversation(@Request() req, @Body() dto: CreateConversationDto) {
    if (dto.participantIds.length === 1) {
      return this.chatService.getOrCreateDirectConversation(req.user.sub, dto.participantIds[0]);
    }
    // Group chat — not yet supported via REST but architecture ready
    throw new BadRequestException('Group chat creation via REST not yet implemented');
  }

  @Get('conversations/:id/messages')
  getMessages(
    @Request() req,
    @Param('id') id: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getMessages(id, req.user.sub, cursor, limit ? parseInt(limit) : 30);
  }

  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 messages per minute per user
  @Post('messages')
  async sendMessage(@Request() req, @Body() dto: SendMessageDto) {
    const msg = await this.chatService.createMessage(req.user.sub, dto);
    await this.chatGateway.broadcastNewMessage(msg);
    return msg;
  }

  // ── Conversation Settings ────────────────────────────────────────────

  @Patch('conversations/:id/mute')
  mute(@Request() req, @Param('id') id: string, @Body() body: { isMuted: boolean }) {
    return this.chatService.updateMemberSettings(id, req.user.sub, { isMuted: body.isMuted });
  }

  @Patch('conversations/:id/pin')
  pin(@Request() req, @Param('id') id: string, @Body() body: { isPinned: boolean }) {
    return this.chatService.updateMemberSettings(id, req.user.sub, { isPinned: body.isPinned });
  }

  @Patch('conversations/:id/archive')
  archive(@Request() req, @Param('id') id: string, @Body() body: { isArchived: boolean }) {
    return this.chatService.updateMemberSettings(id, req.user.sub, { isArchived: body.isArchived });
  }

  // ── AI Notes ────────────────────────────────────────────────────────

  @Post('messages/:id/analyze')
  async analyzeNoteMessage(@Request() req, @Param('id') id: string) {
    const result = await this.chatService.analyzeNoteMessage(id, req.user.sub);
    const msg = (result as any).msg || result;
    const aiReply = (result as any).aiReply;

    await this.chatGateway.server.to(`conv_${msg.conversationId}`).emit('message.edited', {
      messageId: msg.id,
      conversationId: msg.conversationId,
      content: msg.content,
      editedAt: msg.editedAt,
      metadata: msg.metadata,
    });
    await this.chatGateway.server.to(`conv:${msg.conversationId}`).emit('message.edited', {
      messageId: msg.id,
      conversationId: msg.conversationId,
      content: msg.content,
      editedAt: msg.editedAt,
      metadata: msg.metadata,
    });
    if (aiReply) {
      await this.chatGateway.broadcastNewMessage(aiReply);
    }
    return { success: true, data: msg, aiReply };
  }

  @Post('messages/:id/action')
  async executeNoteAction(@Request() req, @Param('id') id: string, @Body() body: { action: string }) {
    const result = await this.chatService.executeNoteAction(id, body.action, req.user.sub);
    const msg = (result as any).msg || result;
    const aiReply = (result as any).aiReply;

    await this.chatGateway.server.to(`conv_${msg.conversationId}`).emit('message.edited', {
      messageId: msg.id,
      conversationId: msg.conversationId,
      content: msg.content,
      editedAt: msg.editedAt,
      metadata: msg.metadata,
    });
    await this.chatGateway.server.to(`conv:${msg.conversationId}`).emit('message.edited', {
      messageId: msg.id,
      conversationId: msg.conversationId,
      content: msg.content,
      editedAt: msg.editedAt,
      metadata: msg.metadata,
    });
    if (aiReply) {
      await this.chatGateway.broadcastNewMessage(aiReply);
    }
    return { success: true, data: msg, aiReply };
  }

  @Patch('conversations/:id/category')
  updateCategory(@Request() req, @Param('id') id: string, @Body() body: { category: string }) {
    return this.chatService.updateChatCategory(id, req.user.sub, body.category);
  }

  @Patch('conversations/:id/notif-pref')
  updateNotifPref(@Request() req, @Param('id') id: string, @Body() body: { notifPref: string }) {
    return this.chatService.updateNotifPref(id, req.user.sub, body.notifPref);
  }

  @Get('conversations/:id/pinned')
  getPinnedMessages(@Request() req, @Param('id') id: string) {
    return this.chatService.getPinnedMessages(id, req.user.sub);
  }

  @Get('conversations/:id/scheduled')
  getScheduledMessages(@Request() req, @Param('id') id: string) {
    return this.chatService.getScheduledMessages(id, req.user.sub);
  }

  @Get('conversations/:id/media')
  getMediaGallery(@Request() req, @Param('id') id: string, @Query('type') type: string) {
    return this.chatService.getMediaGallery(id, req.user.sub, type || 'images');
  }

  // ── Star / Pin Messages ──────────────────────────────────────────────

  @Post('messages/:id/star')
  starMessage(@Request() req, @Param('id') id: string) {
    return this.chatService.starMessage(req.user.sub, id);
  }

  @Post('messages/:id/unstar')
  unstarMessage(@Request() req, @Param('id') id: string) {
    return this.chatService.unstarMessage(req.user.sub, id);
  }

  @Get('messages/starred')
  getStarredMessages(@Request() req) {
    return this.chatService.getStarredMessages(req.user.sub);
  }

  @Post('messages/:id/pin')
  pinMessage(@Request() req, @Param('id') id: string, @Body() body: { conversationId: string }) {
    return this.chatService.pinMessage(req.user.sub, id, body.conversationId);
  }

  @Post('messages/:id/unpin')
  unpinMessage(@Request() req, @Param('id') id: string, @Body() body: { conversationId: string }) {
    return this.chatService.unpinMessage(req.user.sub, id, body.conversationId);
  }

  // ── Scheduled Messages ───────────────────────────────────────────────

  @Post('messages/schedule')
  scheduleMessage(@Request() req, @Body() body: any) {
    return this.chatService.scheduleMessage(req.user.sub, body);
  }

  @Post('scheduled/:id/cancel')
  cancelScheduled(@Request() req, @Param('id') id: string) {
    return this.chatService.cancelScheduledMessage(id, req.user.sub);
  }

  // ── Message Reminders ────────────────────────────────────────────────

  @Post('messages/:id/remind')
  addReminder(@Request() req, @Param('id') id: string, @Body() body: { remindAt: string; note?: string }) {
    return this.chatService.addMessageReminder(req.user.sub, id, new Date(body.remindAt), body.note);
  }

  @Get('reminders')
  getReminders(@Request() req) {
    return this.chatService.getMessageReminders(req.user.sub);
  }

  // ── Forward Message ──────────────────────────────────────────────────

  @Post('messages/:id/forward')
  forwardMessage(@Request() req, @Param('id') id: string, @Body() body: { conversationIds: string[] }) {
    return this.chatService.forwardMessage(id, body.conversationIds, req.user.sub);
  }

  // ── Notes to Self ────────────────────────────────────────────────────

  @Get('notes')
  getNotesConversation(@Request() req) {
    return this.chatService.getOrCreateNotesConversation(req.user.sub);
  }

  // ── AI Insights ──────────────────────────────────────────────────────

  @Get('mini-insight/:cashbookId')
  getMiniInsight(@Request() req, @Param('cashbookId') cashbookId: string) {
    return this.chatService.getMiniInsight(req.user.sub, cashbookId);
  }
}
