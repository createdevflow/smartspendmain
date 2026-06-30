import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { CommunicationService } from './communication.service';

@ApiTags('communication')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'communication', version: '1' })
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  // ── Scheduled Emails ──────────────────────────────────────────────────────

  @Post('emails/schedule')
  scheduleEmail(@CurrentUser() user: any, @Body() dto: any) {
    return this.communicationService.createScheduledEmail(user.sub, dto);
  }

  @Get('emails')
  getScheduledEmails(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.communicationService.getScheduledEmails(user.sub, Number(page) || 1, Number(limit) || 20);
  }

  @Patch('emails/:id')
  updateScheduledEmail(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.communicationService.updateScheduledEmail(user.sub, id, dto);
  }

  @Post('emails/:id/pause')
  @HttpCode(HttpStatus.OK)
  pauseEmail(@CurrentUser() user: any, @Param('id') id: string) {
    return this.communicationService.pauseScheduledEmail(user.sub, id);
  }

  @Post('emails/:id/resume')
  @HttpCode(HttpStatus.OK)
  resumeEmail(@CurrentUser() user: any, @Param('id') id: string) {
    return this.communicationService.resumeScheduledEmail(user.sub, id);
  }

  @Delete('emails/:id')
  @HttpCode(HttpStatus.OK)
  cancelEmail(@CurrentUser() user: any, @Param('id') id: string) {
    return this.communicationService.cancelScheduledEmail(user.sub, id);
  }

  @Post('emails/:id/duplicate')
  @HttpCode(HttpStatus.OK)
  duplicateEmail(@CurrentUser() user: any, @Param('id') id: string) {
    return this.communicationService.duplicateScheduledEmail(user.sub, id);
  }

  @Get('emails/:id/history')
  getEmailHistory(@CurrentUser() user: any, @Param('id') id: string) {
    return this.communicationService.getEmailDeliveryHistory(user.sub, id);
  }

  // ── Scheduled Messages ────────────────────────────────────────────────────

  @Post('messages/schedule')
  scheduleMessage(@CurrentUser() user: any, @Body() dto: any) {
    return this.communicationService.createScheduledMessage(user.sub, dto);
  }

  @Get('messages')
  getScheduledMessages(@CurrentUser() user: any, @Query('conversationId') conversationId?: string) {
    return this.communicationService.getScheduledMessages(user.sub, conversationId);
  }

  @Delete('messages/:id')
  @HttpCode(HttpStatus.OK)
  cancelMessage(@CurrentUser() user: any, @Param('id') id: string) {
    return this.communicationService.cancelScheduledMessage(user.sub, id);
  }

  @Patch('messages/:id/reschedule')
  rescheduleMessage(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { scheduledAt: string },
  ) {
    return this.communicationService.rescheduleMessage(user.sub, id, body.scheduledAt);
  }

  // ── Admin Notification Management ─────────────────────────────────────────

  @Post('admin/notifications')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  createAdminNotification(@CurrentUser() user: any, @Body() dto: any) {
    return this.communicationService.createAdminNotification(user.sub, dto);
  }

  @Get('admin/notifications')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getAdminNotifications(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.communicationService.getAdminNotifications(Number(page) || 1, Number(limit) || 20);
  }

  @Post('admin/notifications/:id/send')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  sendAdminNotification(@Param('id') id: string) {
    return this.communicationService.sendAdminNotification(id);
  }

  @Get('admin/notifications/:id/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getAdminNotificationStats(@Param('id') id: string) {
    return this.communicationService.getAdminNotificationStats(id);
  }

  @Delete('admin/notifications/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  cancelAdminNotification(@Param('id') id: string) {
    return this.communicationService.cancelAdminNotification(id);
  }
}
