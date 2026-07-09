import { Controller, Get, Patch, Post, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateProfileDto, ChangePasswordDto, UpdatePushTokenDto, UploadAvatarDto, SyncContactsDto } from './dto/user.dto';

@ApiTags('users')
@ApiBearerAuth('JWT')
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  profile(@CurrentUser() user: any) { return this.usersService.getProfile(user.sub); }

  @Patch('profile')
  updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) { return this.usersService.updateProfile(user.sub, dto); }

  @Post('change-password')
  changePassword(@CurrentUser() user: any, @Body() dto: ChangePasswordDto) { return this.usersService.changePassword(user.sub, dto); }

  @Delete('account')
  deleteAccount(@CurrentUser() user: any) { return this.usersService.deleteAccount(user.sub); }

  @Get('sessions')
  sessions(@CurrentUser() user: any) { return this.usersService.getSessions(user.sub); }

  @Delete('sessions/:id')
  revokeSession(@CurrentUser() user: any, @Param('id') id: string) { return this.usersService.revokeSession(user.sub, id); }

  @Delete('sessions/all/other')
  revokeAllSessions(@CurrentUser() user: any) { return this.usersService.revokeAllSessions(user.sub); }

  @Patch('push-token')
  updatePushToken(@CurrentUser() user: any, @Body() dto: UpdatePushTokenDto) {
    return this.usersService.updatePushToken(user.sub, dto.token);
  }

  @Post('avatar')
  uploadAvatar(@CurrentUser() user: any, @Body() dto: UploadAvatarDto) {
    return this.usersService.uploadAvatar(user.sub, dto.image);
  }

  @Post('contacts/sync')
  syncContacts(@CurrentUser() user: any, @Body() dto: SyncContactsDto) {
    return this.usersService.syncContacts(user.sub, dto.phoneNumbers);
  }

  @Get('ai-credits')
  getAiCredits(@CurrentUser() user: any) {
    return this.usersService.getAiCredits(user.sub);
  }
}
