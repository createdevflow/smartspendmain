import { Controller, Get, Patch, Delete, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('notifications')
@ApiBearerAuth('JWT')
@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(@CurrentUser() user: any) { return this.notificationsService.findAll(user.sub); }

  @Patch(':id/read')
  markAsRead(@CurrentUser() user: any, @Param('id') id: string) { return this.notificationsService.markAsRead(user.sub, id); }

  @Patch('read-all')
  markAllAsRead(@CurrentUser() user: any) { return this.notificationsService.markAllAsRead(user.sub); }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) { return this.notificationsService.remove(user.sub, id); }
}
