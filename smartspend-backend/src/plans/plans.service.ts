import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FeaturesService } from './features.service';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService, private features: FeaturesService) {}

  async findAll() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        features: {
          include: { feature: { select: { id: true, key: true, name: true, type: true, unit: true, category: true, sortOrder: true } } },
          orderBy: { feature: { sortOrder: 'asc' } },
        },
      },
    });
  }

  async findBySlug(slug: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { slug },
      include: { features: { include: { feature: true } } },
    });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async getUserPlan(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { plan: { include: { features: { include: { feature: true } } } } },
    });
    const featureMap = await this.features.getUserFeatures(userId);

    // Get current month usage
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const txCount = await this.prisma.transaction.count({
      where: { userId, createdAt: { gte: startOfMonth }, deletedAt: null },
    });
    const cashbookCount = await this.prisma.cashbook.count({
      where: { userId, isArchived: false, deletedAt: null },
    });

    return {
      plan: user?.plan ?? null,
      features: featureMap,
      usage: {
        cashbooks: { current: cashbookCount, limit: featureMap.max_cashbooks ?? '3' },
        transactionsThisMonth: { current: txCount, limit: featureMap.max_transactions_monthly ?? '200' },
      },
    };
  }

  async subscribeToPlan(userId: string, planId: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) throw new NotFoundException('Active plan not found');

    await this.prisma.user.update({
      where: { id: userId },
      data: { planId: plan.id },
    });

    return { message: `Successfully subscribed to ${plan.name} plan`, plan };
  }
}
