import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('analytics')
@ApiBearerAuth('JWT')
@Controller({ path: 'analytics', version: '1' })
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard summary (income, expense, savings, recent transactions)' })
  dashboard(@CurrentUser() user: any) {
    return this.analyticsService.getDashboard(user.sub);
  }

  @Get('cashflow')
  @ApiOperation({ summary: 'Cash flow over time (weekly/monthly/yearly)' })
  cashflow(
    @CurrentUser() user: any,
    @Query('period') period: 'weekly' | 'monthly' | 'yearly' = 'monthly',
    @Query('cashbookId') cashbookId?: string,
  ) {
    return this.analyticsService.getCashflow(user.sub, period, cashbookId);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Category breakdown (donut chart data)' })
  categories(
    @CurrentUser() user: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('type') type?: string,
  ) {
    return this.analyticsService.getCategoryBreakdown(user.sub, from, to, type || 'EXPENSE');
  }

  @Get('insights')
  @ApiOperation({ summary: 'Auto-generated personalized insights' })
  insights(@CurrentUser() user: any) {
    return this.analyticsService.getInsights(user.sub);
  }

  @Get('networth')
  @ApiOperation({ summary: 'Net worth across all cashbooks' })
  netWorth(@CurrentUser() user: any) {
    return this.analyticsService.getNetWorth(user.sub);
  }

  @Get('heatmap')
  @ApiOperation({ summary: 'Spending heatmap calendar' })
  heatmap(@CurrentUser() user: any, @Query('year') year?: number) {
    return this.analyticsService.getHeatmap(user.sub, year || new Date().getFullYear());
  }

  @Get('burn-rate')
  @ApiOperation({ summary: 'Gamification Burn Rate & Streak' })
  burnRate(@CurrentUser() user: any) {
    return this.analyticsService.getBurnRate(user.sub);
  }
}
