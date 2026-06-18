import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('plans')
@Controller({ path: 'plans', version: '1' })
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all active plans with features (public)' })
  findAll() {
    return this.plansService.findAll();
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get plan by slug' })
  findOne(@Param('slug') slug: string) {
    return this.plansService.findBySlug(slug);
  }

  @Get('my/current')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: "Get current user's plan and feature limits" })
  myPlan(@CurrentUser() user: any) {
    return this.plansService.getUserPlan(user.sub);
  }

  @Post('subscribe/:planId')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Subscribe user to a plan' })
  subscribeToPlan(@CurrentUser() user: any, @Param('planId') planId: string) {
    return this.plansService.subscribeToPlan(user.sub, planId);
  }
}

