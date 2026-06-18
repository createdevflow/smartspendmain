import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BudgetsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.budget.findMany({
      where: { userId, isActive: true },
      include: { category: { select: { id: true, name: true, emoji: true, color: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, dto: any) {
    return this.prisma.budget.create({
      data: { userId, ...dto, startDate: dto.startDate ? new Date(dto.startDate) : new Date() },
    });
  }

  async findOne(userId: string, id: string) {
    const budget = await this.prisma.budget.findFirst({ where: { id, userId } });
    if (!budget) throw new NotFoundException('Budget not found');
    return budget;
  }

  async getProgress(userId: string, id: string) {
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

  async update(userId: string, id: string, dto: any) {
    const budget = await this.prisma.budget.findFirst({ where: { id, userId } });
    if (!budget) throw new NotFoundException('Budget not found');
    return this.prisma.budget.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    const budget = await this.prisma.budget.findFirst({ where: { id, userId } });
    if (!budget) throw new NotFoundException('Budget not found');
    await this.prisma.budget.update({ where: { id }, data: { isActive: false } });
    return { message: 'Budget removed' };
  }
}
