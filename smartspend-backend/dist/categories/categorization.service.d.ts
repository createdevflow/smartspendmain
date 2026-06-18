import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
export declare class CategorizationService {
    private prisma;
    private cache;
    constructor(prisma: PrismaService, cache: CacheService);
    suggest(userId: string, merchant?: string, notes?: string): Promise<string | null>;
    suggestWithDetails(userId: string, merchant?: string, notes?: string): Promise<{
        name: string;
        id: string;
        color: string;
        emoji: string;
    } | null>;
    learnMapping(userId: string, merchant: string, categoryId: string): Promise<void>;
    invalidateRulesCache(): Promise<void>;
    private getKeywordRules;
}
