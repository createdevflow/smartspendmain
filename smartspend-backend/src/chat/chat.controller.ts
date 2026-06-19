import { Controller, Get, Post, Patch, Body, Param, Query, Request } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto, CreateConversationDto, SendContactRequestDto } from './dto/chat.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('chat')
@ApiBearerAuth('JWT')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

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
    throw new Error('Group chat creation via REST not yet implemented');
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
}
