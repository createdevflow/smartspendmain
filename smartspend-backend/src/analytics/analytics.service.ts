import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrencyService } from '../currency/currency.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService, private currency: CurrencyService) {}

  async getDashboard(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const baseCurrency = user?.defaultCurrency || 'INR';
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const startOfLastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const endOfLastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999));

    const [monthIncome, monthExpense, lastMonthIncome, lastMonthExpense, recentTx, netWorth] = await Promise.all([
      this.sumTransactions(userId, 'INCOME', startOfMonth, now),
      this.sumTransactions(userId, 'EXPENSE', startOfMonth, now),
      this.sumTransactions(userId, 'INCOME', startOfLastMonth, endOfLastMonth),
      this.sumTransactions(userId, 'EXPENSE', startOfLastMonth, endOfLastMonth),
      this.prisma.transaction.findMany({
        where: { userId, deletedAt: null },
        orderBy: { date: 'desc' }, take: 5,
        include: { category: { select: { id: true, name: true, emoji: true, color: true } }, cashbook: true },
      }),
      this.getNetWorth(userId),
    ]);

    const savings = monthIncome - monthExpense;
    const savingsRate = monthIncome > 0 ? Math.round((savings / monthIncome) * 100) : 0;

    // Month-over-month change
    const expenseChange = lastMonthExpense > 0
      ? Math.round(((monthExpense - lastMonthExpense) / lastMonthExpense) * 100) : 0;

    return {
      period: { from: startOfMonth, to: now },
      baseCurrency,
      summary: {
        income: monthIncome,
        expense: monthExpense,
        savings,
        savingsRate,
        expenseChange, // % vs last month
      },
      netWorth,
      recentTransactions: recentTx,
    };
  }

  async getCashflow(userId: string, period: 'weekly' | 'monthly' | 'yearly' = 'monthly', cashbookId?: string) {
    const now = new Date();
    const points: { label: string; income: number; expense: number; from: Date; to: Date }[] = [];

    if (period === 'weekly') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i, 0, 0, 0, 0));
        const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i, 23, 59, 59, 999));
        const [income, expense] = await Promise.all([
          this.sumTransactions(userId, 'INCOME', from, to, cashbookId),
          this.sumTransactions(userId, 'EXPENSE', from, to, cashbookId),
        ]);
        points.push({ label: from.toLocaleDateString('en', { weekday: 'short' }), income, expense, from, to });
      }
    } else if (period === 'monthly') {
      // Last 6 months
      for (let i = 5; i >= 0; i--) {
        const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
        const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 0, 23, 59, 59, 999));
        const [income, expense] = await Promise.all([
          this.sumTransactions(userId, 'INCOME', from, to, cashbookId),
          this.sumTransactions(userId, 'EXPENSE', from, to, cashbookId),
        ]);
        points.push({ label: from.toLocaleDateString('en', { month: 'short', year: '2-digit' }), income, expense, from, to });
      }
    } else {
      // Last 5 years
      for (let i = 4; i >= 0; i--) {
        const from = new Date(Date.UTC(now.getUTCFullYear() - i, 0, 1));
        const to = new Date(Date.UTC(now.getUTCFullYear() - i, 11, 31, 23, 59, 59, 999));
        const [income, expense] = await Promise.all([
          this.sumTransactions(userId, 'INCOME', from, to, cashbookId),
          this.sumTransactions(userId, 'EXPENSE', from, to, cashbookId),
        ]);
        points.push({ label: from.getFullYear().toString(), income, expense, from, to });
      }
    }

    return points;
  }

  async getCategoryBreakdown(userId: string, from?: string, to?: string, type = 'EXPENSE') {
    const fromDate = from ? new Date(from) : new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
    const toDate = to ? new Date(to) : new Date();

    const result = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId, type: type as any, date: { gte: fromDate, lte: toDate }, deletedAt: null },
      _sum: { amountInBookCurrency: true },
      _count: { id: true },
    });

    const total = result.reduce((sum, r) => sum + Number(r._sum.amountInBookCurrency || 0), 0);

    const withCategories = await Promise.all(result.map(async (r) => {
      const cat = r.categoryId ? await this.prisma.category.findUnique({
        where: { id: r.categoryId }, select: { id: true, name: true, emoji: true, color: true },
      }) : null;
      const amount = Number(r._sum.amountInBookCurrency || 0);
      return {
        category: cat || { id: null, name: 'Uncategorized', emoji: '📦', color: '#94A3B8' },
        amount,
        count: r._count.id,
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
      };
    }));

    return { data: withCategories.sort((a, b) => b.amount - a.amount), total, type, from: fromDate, to: toDate };
  }

  async getInsights(userId: string): Promise<string[]> {
    const insights: string[] = [];
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [thisMonthExpense, lastMonthExpense] = await Promise.all([
      this.sumTransactions(userId, 'EXPENSE', startOfMonth, now),
      this.sumTransactions(userId, 'EXPENSE', startOfLastMonth, endOfLastMonth),
    ]);

    if (lastMonthExpense > 0) {
      const change = ((thisMonthExpense - lastMonthExpense) / lastMonthExpense) * 100;
      if (change > 20) insights.push(`📈 Your spending is up ${Math.round(change)}% compared to last month`);
      else if (change < -20) insights.push(`📉 Great! You've reduced spending by ${Math.round(Math.abs(change))}% vs last month`);
    }

    // Top spending category
    const topCategory = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId, type: 'EXPENSE', date: { gte: startOfMonth }, deletedAt: null },
      _sum: { amountInBookCurrency: true },
      orderBy: { _sum: { amountInBookCurrency: 'desc' } },
      take: 1,
    });
    if (topCategory.length > 0 && topCategory[0].categoryId) {
      const cat = await this.prisma.category.findUnique({ where: { id: topCategory[0].categoryId } });
      if (cat) insights.push(`${cat.emoji} ${cat.name} is your biggest expense category this month`);
    }

    if (insights.length === 0) insights.push('💡 Add more transactions to unlock personalized insights');
    return insights;
  }

  async getNetWorth(userId: string) {
    const cashbooks = await this.prisma.cashbook.findMany({
      where: { userId, isArchived: false, deletedAt: null },
    });
    let total = 0;
    for (const book of cashbooks) {
      const [inc, exp] = await Promise.all([
        this.sumTransactions(userId, 'INCOME', undefined, undefined, book.id),
        this.sumTransactions(userId, 'EXPENSE', undefined, undefined, book.id),
      ]);
      total += Number(book.openingBalance) + inc - exp;
    }
    return { netWorth: total };
  }

  async getHeatmap(userId: string, year: number) {
    const from = new Date(year, 0, 1);
    const to = new Date(year, 11, 31);
    const transactions = await this.prisma.transaction.findMany({
      where: { userId, type: 'EXPENSE', date: { gte: from, lte: to }, deletedAt: null },
      select: { date: true, amountInBookCurrency: true },
    });

    const map: Record<string, number> = {};
    for (const tx of transactions) {
      const key = tx.date.toISOString().split('T')[0];
      map[key] = (map[key] || 0) + Number(tx.amountInBookCurrency || 0);
    }
    return map;
  }

  private async sumTransactions(userId: string, type: string, from?: Date, to?: Date, cashbookId?: string) {
    const agg = await this.prisma.transaction.aggregate({
      where: {
        userId, type: type as any, deletedAt: null,
        ...(cashbookId ? { cashbookId } : {}),
        ...(from || to ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
      },
      _sum: { amountInBookCurrency: true },
    });
    return Number(agg._sum.amountInBookCurrency || 0);
  }

  // ── Gamification ───────────────────────────────────────────────────────────
  async getBurnRate(userId: string, targetCashbookId?: string) {
    const featureEnabled = await this.prisma.appConfig.findUnique({ where: { key: 'feature_gamification_active' } });
    if (featureEnabled?.value !== 'true') return null;

    const now = new Date();
    
    // Get all accessible cashbook IDs (owned or shared)
    const accessibleCashbooks = await this.prisma.cashbook.findMany({
      where: {
        OR: [
          { userId },
          { members: { some: { userId } } }
        ],
        isArchived: false,
        deletedAt: null,
        ...(targetCashbookId ? { id: targetCashbookId } : {})
      },
      select: { id: true, openingBalance: true }
    });
    
    if (accessibleCashbooks.length === 0) return { streak: 0, burnRateDaysLeft: 0, avgDailySpend: 0, netWorth: 0 };
    const cashbookIds = accessibleCashbooks.map(c => c.id);

    // 1. Calculate No Spend Streak
    const expenses = await this.prisma.transaction.findMany({
      where: { cashbookId: { in: cashbookIds }, type: 'EXPENSE', deletedAt: null },
      orderBy: { date: 'desc' },
      select: { date: true },
    });
    
    // Map dates to YYYY-MM-DD
    const expenseDays = new Set(expenses.map(t => t.date.toISOString().split('T')[0]));
    let streak = 0;
    // Check from yesterday backwards
    let checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() - 1);
    
    if (expenses.length > 0) {
      const oldestDateStr = expenses[expenses.length - 1].date.toISOString().split('T')[0];
      for (let i = 0; i < 365; i++) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (expenseDays.has(dateStr)) break;
        if (dateStr < oldestDateStr) break;
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    // 2. Calculate Burn Rate (Days Left = Balance / Avg Daily Spend)
    const aggIncome = await this.prisma.transaction.aggregate({
      where: { cashbookId: { in: cashbookIds }, type: 'INCOME', deletedAt: null },
      _sum: { amountInBookCurrency: true }
    });
    const aggExpense = await this.prisma.transaction.aggregate({
      where: { cashbookId: { in: cashbookIds }, type: 'EXPENSE', deletedAt: null },
      _sum: { amountInBookCurrency: true }
    });
    
    let netWorth = 0;
    for (const book of accessibleCashbooks) netWorth += Number(book.openingBalance);
    netWorth += Number(aggIncome._sum.amountInBookCurrency || 0) - Number(aggExpense._sum.amountInBookCurrency || 0);
    
    // Avg daily spend over last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const last30Agg = await this.prisma.transaction.aggregate({
      where: { cashbookId: { in: cashbookIds }, type: 'EXPENSE', deletedAt: null, date: { gte: thirtyDaysAgo, lte: now } },
      _sum: { amountInBookCurrency: true },
    });
    const last30Spend = Number(last30Agg._sum.amountInBookCurrency || 0);
    const avgDailySpend = last30Spend / 30;

    let daysLeft = 0;
    if (avgDailySpend > 0) {
      daysLeft = Math.max(0, Math.floor(netWorth / avgDailySpend));
    } else if (netWorth > 0 && expenses.length > 0) {
      daysLeft = 365;
    } else {
      daysLeft = 0;
    }

    return {
      streak,
      burnRateDaysLeft: daysLeft < 0 ? 0 : daysLeft,
      avgDailySpend,
      netWorth
    };
  }
}
