import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('admin/ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AiController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('analytics')
  async getAiAnalytics(@Query('days') daysStr: string = '30') {
    const days = parseInt(daysStr, 10);
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);

    const [totalRequests, successfulRequests, totalCredits, totalTokens] = await Promise.all([
      this.prisma.aiRequestLog.count({
        where: { createdAt: { gte: dateLimit } }
      }),
      this.prisma.aiRequestLog.count({
        where: { status: 'SUCCESS', createdAt: { gte: dateLimit } }
      }),
      this.prisma.aiRequestLog.aggregate({
        _sum: { creditsCost: true },
        where: { status: 'SUCCESS', createdAt: { gte: dateLimit } }
      }),
      this.prisma.aiRequestLog.aggregate({
        _sum: { tokensConsumed: true },
        where: { status: 'SUCCESS', createdAt: { gte: dateLimit } }
      })
    ]);

    const featureUsageRaw = await this.prisma.aiRequestLog.groupBy({
      by: ['feature'],
      _count: { id: true },
      where: { status: 'SUCCESS', createdAt: { gte: dateLimit } }
    });

    return {
      success: true,
      data: {
        totalRequests,
        successfulRequests,
        errorRate: totalRequests > 0 ? ((totalRequests - successfulRequests) / totalRequests * 100).toFixed(2) : 0,
        totalCreditsConsumed: totalCredits._sum.creditsCost || 0,
        totalTokensConsumed: totalTokens._sum.tokensConsumed || 0,
        featureUsage: featureUsageRaw.map(f => ({
          feature: f.feature,
          count: f._count.id
        }))
      }
    };
  }
}
