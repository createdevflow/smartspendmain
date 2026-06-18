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
exports.BudgetsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BudgetsService = class BudgetsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(userId) {
        return this.prisma.budget.findMany({
            where: { userId, isActive: true },
            include: { category: { select: { id: true, name: true, emoji: true, color: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(userId, dto) {
        return this.prisma.budget.create({
            data: { userId, ...dto, startDate: dto.startDate ? new Date(dto.startDate) : new Date() },
        });
    }
    async findOne(userId, id) {
        const budget = await this.prisma.budget.findFirst({ where: { id, userId } });
        if (!budget)
            throw new common_1.NotFoundException('Budget not found');
        return budget;
    }
    async getProgress(userId, id) {
        const budget = await this.findOne(userId, id);
        const now = new Date();
        const startOfPeriod = budget.startDate;
        const spent = await this.prisma.transaction.aggregate({
            where: {
                userId, type: 'EXPENSE', deletedAt: null,
                ...(budget.categoryId ? { categoryId: budget.categoryId } : {}),
                ...(budget.cashbookId ? { cashbookId: budget.cashbookId } : {}),
                date: { gte: startOfPeriod, lte: budget.endDate || now },
            },
            _sum: { amountInBookCurrency: true },
        });
        const spentAmount = Number(spent._sum.amountInBookCurrency || 0);
        const budgetAmount = Number(budget.amount);
        const percentage = budgetAmount > 0 ? Math.round((spentAmount / budgetAmount) * 100) : 0;
        return {
            budget,
            spent: spentAmount,
            remaining: Math.max(0, budgetAmount - spentAmount),
            percentage,
            isOver: spentAmount > budgetAmount,
        };
    }
    async update(userId, id, dto) {
        const budget = await this.prisma.budget.findFirst({ where: { id, userId } });
        if (!budget)
            throw new common_1.NotFoundException('Budget not found');
        return this.prisma.budget.update({ where: { id }, data: dto });
    }
    async remove(userId, id) {
        const budget = await this.prisma.budget.findFirst({ where: { id, userId } });
        if (!budget)
            throw new common_1.NotFoundException('Budget not found');
        await this.prisma.budget.update({ where: { id }, data: { isActive: false } });
        return { message: 'Budget removed' };
    }
};
exports.BudgetsService = BudgetsService;
exports.BudgetsService = BudgetsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BudgetsService);
//# sourceMappingURL=budgets.service.js.map