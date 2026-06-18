import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GoalsService } from './goals.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('goals')
@ApiBearerAuth('JWT')
@Controller({ path: 'goals', version: '1' })
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}
  @Get() findAll(@CurrentUser() u: any) { return this.goalsService.findAll(u.sub); }
  @Post() create(@CurrentUser() u: any, @Body() dto: any) { return this.goalsService.create(u.sub, dto); }
  @Get(':id') findOne(@CurrentUser() u: any, @Param('id') id: string) { return this.goalsService.findOne(u.sub, id); }
  @Patch(':id') update(@CurrentUser() u: any, @Param('id') id: string, @Body() dto: any) { return this.goalsService.update(u.sub, id, dto); }
  @Delete(':id') remove(@CurrentUser() u: any, @Param('id') id: string) { return this.goalsService.remove(u.sub, id); }
  @Post(':id/contribute') contribute(@CurrentUser() u: any, @Param('id') id: string, @Body() dto: any) { return this.goalsService.contribute(u.sub, id, dto); }
  @Get(':id/history') history(@CurrentUser() u: any, @Param('id') id: string) { return this.goalsService.getHistory(u.sub, id); }
}
