import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CashbooksService } from './cashbooks.service';
import { CashbookMembersService } from './cashbooks.members.service';
import { CreateCashbookDto } from './dto/create-cashbook.dto';
import { UpdateCashbookDto } from './dto/update-cashbook.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('cashbooks')
@ApiBearerAuth('JWT')
@Controller({ path: 'cashbooks', version: '1' })
export class CashbooksController {
  constructor(
    private readonly cashbooksService: CashbooksService,
    private readonly membersService: CashbookMembersService,
  ) {}

  @Get()
  findAll(@CurrentUser() user: any, @Query('archived') archived?: string) {
    return this.cashbooksService.findAll(user.sub, archived === 'true');
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateCashbookDto) {
    return this.cashbooksService.create(user.sub, dto);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.cashbooksService.findOne(user.sub, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateCashbookDto) {
    return this.cashbooksService.update(user.sub, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.cashbooksService.remove(user.sub, id);
  }

  @Patch('reorder/sort')
  reorder(@CurrentUser() user: any, @Body() body: { orderedIds: string[] }) {
    return this.cashbooksService.reorder(user.sub, body.orderedIds);
  }

  // ── Members ────────────────────────────────────────────────────────────────

  @Get(':id/members')
  getMembers(@CurrentUser() user: any, @Param('id') id: string) {
    return this.membersService.getMembers(user.sub, id);
  }

  @Post(':id/members')
  inviteMember(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { email: string; role: 'EDITOR' | 'VIEWER' },
  ) {
    return this.membersService.inviteMember(user.sub, id, { ...body, role: body.role as any });
  }

  @Post(':id/members/link')
  createInviteLink(@CurrentUser() user: any, @Param('id') id: string) {
    return this.membersService.createInviteLink(user.sub, id);
  }

  @Delete(':id/members/:memberId')
  removeMember(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.membersService.removeMember(user.sub, id, memberId);
  }

  @Patch(':id/members/:memberId')
  updateMemberRole(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() body: { role: 'EDITOR' | 'VIEWER' },
  ) {
    return this.membersService.updateMemberRole(user.sub, id, memberId, body.role);
  }

  @Delete(':id/leave')
  leaveBook(@CurrentUser() user: any, @Param('id') id: string) {
    return this.membersService.leaveBook(user.sub, id);
  }

  @Post('accept-invite/:token')
  acceptInvite(@CurrentUser() user: any, @Param('token') token: string) {
    return this.membersService.acceptInvite(user.sub, token);
  }
}
