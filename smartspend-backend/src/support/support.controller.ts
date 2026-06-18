import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('support')
@ApiBearerAuth('JWT')
@Controller({ path: 'support', version: '1' })
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('tickets')
  getTickets(@CurrentUser() user: any) { return this.supportService.getTickets(user.sub); }

  @Post('tickets')
  createTicket(@CurrentUser() user: any, @Body() dto: any) { return this.supportService.createTicket(user.sub, dto); }

  @Post('tickets/:id/reply')
  replyTicket(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) { return this.supportService.replyTicket(user.sub, id, dto); }
}
