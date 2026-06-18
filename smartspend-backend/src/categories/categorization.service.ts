import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';

interface KeywordRule {
  categoryId: string;
  keyword: string;
  matchType: string;
  priority: number;
}

@Injectable()
export class CategorizationService {
  constructor(private prisma: PrismaService, private cache: CacheService) {}

  /**
   * Suggest a category based on merchant name and/or notes.
   * Priority order:
   *   1. User's personally learned merchant→category mapping (highest priority)
   *   2. Global keyword rules (from DB, Redis-cached)
   *   3. null (no suggestion — user picks manually)
   */
  async suggest(userId: string, merchant?: string, notes?: string): Promise<string | null> {
    const text = [merchant, notes]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .trim();

    if (!text) return null;

    // 1. Check user's personal merchant mapping
    const personal = await this.prisma.userMerchantMapping.findFirst({
      where: {
        userId,
        merchant: { contains: text.split(' ')[0], mode: 'insensitive' }, // match on first word
      },
      orderBy: { usageCount: 'desc' },
    });
    if (personal) return personal.categoryId;

    // 2. Global keyword rules (cached in Redis for 1 hour)
    const rules = await this.getKeywordRules();

    // Sort by priority descending, then check
    for (const rule of rules) {
      let matched = false;
      switch (rule.matchType) {
        case 'exact':
          matched = text === rule.keyword;
          break;
        case 'starts_with':
          matched = text.startsWith(rule.keyword);
          break;
        case 'contains':
        default:
          matched = text.includes(rule.keyword);
      }
      if (matched) return rule.categoryId;
    }

    return null;
  }

  /**
   * Suggest a category with category details (for API response)
   */
  async suggestWithDetails(userId: string, merchant?: string, notes?: string) {
    const categoryId = await this.suggest(userId, merchant, notes);
    if (!categoryId) return null;
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, name: true, emoji: true, color: true },
    });
    return category;
  }

  /**
   * Record a confirmed merchant→category choice for future auto-apply
   */
  async learnMapping(userId: string, merchant: string, categoryId: string): Promise<void> {
    if (!merchant?.trim()) return;
    const normalizedMerchant = merchant.toLowerCase().trim().split(' ')[0]; // Use first word

    await this.prisma.userMerchantMapping.upsert({
      where: { userId_merchant: { userId, merchant: normalizedMerchant } },
      create: { userId, merchant: normalizedMerchant, categoryId },
      update: { categoryId, usageCount: { increment: 1 } },
    });
  }

  /** Invalidate keyword rules cache (call after admin adds/removes keywords) */
  async invalidateRulesCache(): Promise<void> {
    await this.cache.del('category:keyword:rules');
  }

  private async getKeywordRules(): Promise<KeywordRule[]> {
    const cached = await this.cache.get<KeywordRule[]>('category:keyword:rules');
    if (cached) return cached;

    const rules = await this.prisma.categoryKeyword.findMany({
      select: { categoryId: true, keyword: true, matchType: true, priority: true },
      orderBy: { priority: 'desc' },
    });

    await this.cache.set('category:keyword:rules', rules, 3600); // 1hr cache
    return rules;
  }
}
