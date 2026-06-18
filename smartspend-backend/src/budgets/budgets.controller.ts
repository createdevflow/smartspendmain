import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('budgets')
@ApiBearerAuth('JWT')
@Controller({ path: 'budgets', version: '1' })
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  findAll(@CurrentUser() user: any) { return this.budgetsService.findAll(user.sub); }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: any) { return this.budgetsService.create(user.sub, dto); }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) { return this.budgetsService.findOne(user.sub, id); }

  @Get(':id/progress')
  progress(@CurrentUser() user: any, @Param('id') id: string) { return this.budgetsService.getProgress(user.sub, id); }

  @Patch(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) { return this.budgetsService.update(user.sub, id, dto); }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) { return this.budgetsService.remove(user.sub, id); }
}
