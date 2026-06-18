import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class FeaturesService {
  constructor(private prisma: PrismaService, private cache: CacheService) {}

  /** Get all feature key→value for a user (Redis-cached 5 min) */
  async getUserFeatures(userId: string): Promise<Record<string, string>> {
    const cacheKey = `user:features:${userId}`;
    const cached = await this.cache.get<Record<string, string>>(cacheKey);
    if (cached) return cached;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        plan: { include: { features: { include: { feature: true } } } },
      },
    });

    // Start with defaults
    const allFeatures = await this.prisma.feature.findMany();
    const features: Record<string, string> = {};
    for (const f of allFeatures) features[f.key] = f.defaultValue;

    // Override with plan values
    if (user?.plan?.features) {
      for (const pf of user.plan.features) {
        features[pf.feature.key] = pf.value;
      }
    }

    await this.cache.set(cacheKey, features, 300); // 5 minute cache
    return features;
  }

  async check(userId: string, featureKey: string): Promise<string> {
    const features = await this.getUserFeatures(userId);
    return features[featureKey] ?? '0';
  }

  async canUse(userId: string, featureKey: string): Promise<boolean> {
    const value = await this.check(userId, featureKey);
    if (value === 'true' || value === '-1') return true;
    if (value === 'false' || value === '0') return false;
    return Number(value) > 0;
  }

  async getNumericLimit(userId: string, featureKey: string): Promise<number> {
    const value = await this.check(userId, featureKey);
    if (value === '-1') return Infinity;
    return parseInt(value, 10) || 0;
  }

  /** Invalidate feature cache for a user (call after plan change) */
  async invalidate(userId: string) {
    await this.cache.del(`user:features:${userId}`);
  }
}
