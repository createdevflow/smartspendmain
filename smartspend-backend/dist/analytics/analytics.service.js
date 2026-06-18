"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const currency_service_1 = require("../currency/currency.service");
let AnalyticsService = class AnalyticsService {
    constructor(prisma, currency) {
        this.prisma = prisma;
        this.currency = currency;
    }
    async getDashboard(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        const baseCurrency = user?.defaultCurrency || 'INR';
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
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
                expenseChange,
            },
            netWorth,
            recentTransactions: recentTx,
        };
    }
    async getCashflow(userId, period = 'monthly', cashbookId) {
        const now = new Date();
        const points = [];
        if (period === 'weekly') {
            for (let i = 6; i >= 0; i--) {
                const from = new Date(now);
                from.setDate(from.getDate() - i);
                from.setHours(0, 0, 0, 0);
                const to = new Date(from);
                to.setHours(23, 59, 59, 999);
                const [income, expense] = await Promise.all([
                    this.sumTransactions(userId, 'INCOME', from, to, cashbookId),
                    this.sumTransactions(userId, 'EXPENSE', from, to, cashbookId),
                ]);
                points.push({ label: from.toLocaleDateString('en', { weekday: 'short' }), income, expense, from, to });
            }
        }
        else if (period === 'monthly') {
            for (let i = 5; i >= 0; i--) {
                const from = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const to = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
                const [income, expense] = await Promise.all([
                    this.sumTransactions(userId, 'INCOME', from, to, cashbookId),
                    this.sumTransactions(userId, 'EXPENSE', from, to, cashbookId),
                ]);
                points.push({ label: from.toLocaleDateString('en', { month: 'short', year: '2-digit' }), income, expense, from, to });
            }
        }
        else {
            for (let i = 4; i >= 0; i--) {
                const from = new Date(now.getFullYear() - i, 0, 1);
                const to = new Date(now.getFullYear() - i, 11, 31);
                const [income, expense] = await Promise.all([
                    this.sumTransactions(userId, 'INCOME', from, to, cashbookId),
                    this.sumTransactions(userId, 'EXPENSE', from, to, cashbookId),
                ]);
                points.push({ label: from.getFullYear().toString(), income, expense, from, to });
            }
        }
        return points;
    }
    async getCategoryBreakdown(userId, from, to, type = 'EXPENSE') {
        const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const toDate = to ? new Date(to) : new Date();
        const result = await this.prisma.transaction.groupBy({
            by: ['categoryId'],
            where: { userId, type: type, date: { gte: fromDate, lte: toDate }, deletedAt: null },
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
    async getInsights(userId) {
        const insights = [];
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
            if (change > 20)
                insights.push(`📈 Your spending is up ${Math.round(change)}% compared to last month`);
            else if (change < -20)
                insights.push(`📉 Great! You've reduced spending by ${Math.round(Math.abs(change))}% vs last month`);
        }
        const topCategory = await this.prisma.transaction.groupBy({
            by: ['categoryId'],
            where: { userId, type: 'EXPENSE', date: { gte: startOfMonth }, deletedAt: null },
            _sum: { amountInBookCurrency: true },
            orderBy: { _sum: { amountInBookCurrency: 'desc' } },
            take: 1,
        });
        if (topCategory.length > 0 && topCategory[0].categoryId) {
            const cat = await this.prisma.category.findUnique({ where: { id: topCategory[0].categoryId } });
            if (cat)
                insights.push(`${cat.emoji} ${cat.name} is your biggest expense category this month`);
        }
        if (insights.length === 0)
            insights.push('💡 Add more transactions to unlock personalized insights');
        return insights;
    }
    async getNetWorth(userId) {
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
    async getHeatmap(userId, year) {
        const from = new Date(year, 0, 1);
        const to = new Date(year, 11, 31);
        const transactions = await this.prisma.transaction.findMany({
            where: { userId, type: 'EXPENSE', date: { gte: from, lte: to }, deletedAt: null },
            select: { date: true, amountInBookCurrency: true },
        });
        const map = {};
        for (const tx of transactions) {
            const key = tx.date.toISOString().split('T')[0];
            map[key] = (map[key] || 0) + Number(tx.amountInBookCurrency || 0);
        }
        return map;
    }
    async sumTransactions(userId, type, from, to, cashbookId) {
        const agg = await this.prisma.transaction.aggregate({
            where: {
                userId, type: type, deletedAt: null,
                ...(cashbookId ? { cashbookId } : {}),
                ...(from || to ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
            },
            _sum: { amountInBookCurrency: true },
        });
        return Number(agg._sum.amountInBookCurrency || 0);
    }
    async getBurnRate(userId) {
        const featureEnabled = await this.prisma.systemSetting.findUnique({ where: { key: 'feature_gamification_active' } });
        if (featureEnabled?.value !== 'true')
            return null;
        const now = new Date();
        const expenses = await this.prisma.transaction.findMany({
            where: { userId, type: 'EXPENSE', deletedAt: null },
            orderBy: { date: 'desc' },
            select: { date: true },
        });
        const expenseDays = new Set(expenses.map(t => t.date.toISOString().split('T')[0]));
        let streak = 0;
        let checkDate = new Date(now);
        checkDate.setDate(checkDate.getDate() - 1);
        for (let i = 0; i < 365; i++) {
            const dateStr = checkDate.toISOString().split('T')[0];
            if (expenseDays.has(dateStr))
                break;
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        }
        const { netWorth } = await this.getNetWorth(userId);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const last30Spend = await this.sumTransactions(userId, 'EXPENSE', thirtyDaysAgo, now);
        const avgDailySpend = last30Spend / 30;
        let daysLeft = 999;
        if (avgDailySpend > 0) {
            daysLeft = Math.floor(netWorth / avgDailySpend);
        }
        return {
            streak,
            burnRateDaysLeft: daysLeft < 0 ? 0 : daysLeft,
            avgDailySpend,
            netWorth
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, currency_service_1.CurrencyService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map