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
  dashboard(@CurrentUser() user: any, @Query('cashbookId') cashbookId?: string) {
    return this.analyticsService.getDashboard(user.sub, cashbookId);
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
    @Query('cashbookId') cashbookId?: string,
  ) {
    return this.analyticsService.getCategoryBreakdown(user.sub, from, to, type || 'EXPENSE', cashbookId);
  }

  @Get('insights')
  @ApiOperation({ summary: 'Auto-generated personalized insights' })
  insights(@CurrentUser() user: any, @Query('cashbookId') cashbookId?: string) {
    return this.analyticsService.getInsights(user.sub, cashbookId);
  }

  @Get('networth')
  @ApiOperation({ summary: 'Net worth across cashbooks' })
  netWorth(@CurrentUser() user: any, @Query('cashbookId') cashbookId?: string) {
    return this.analyticsService.getNetWorth(user.sub, cashbookId);
  }

  @Get('heatmap')
  @ApiOperation({ summary: 'Spending heatmap calendar' })
  heatmap(@CurrentUser() user: any, @Query('year') year?: number, @Query('cashbookId') cashbookId?: string) {
    return this.analyticsService.getHeatmap(user.sub, year || new Date().getFullYear(), cashbookId);
  }

  @Get('burn-rate')
  @ApiOperation({ summary: 'Gamification Burn Rate & Streak' })
  burnRate(@CurrentUser() user: any, @Query('cashbookId') cashbookId?: string) {
    return this.analyticsService.getBurnRate(user.sub, cashbookId);
  }
}
