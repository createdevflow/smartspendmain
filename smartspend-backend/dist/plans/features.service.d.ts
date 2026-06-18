import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
export declare class FeaturesService {
    private prisma;
    private cache;
    constructor(prisma: PrismaService, cache: CacheService);
    getUserFeatures(userId: string): Promise<Record<string, string>>;
    check(userId: string, featureKey: string): Promise<string>;
    canUse(userId: string, featureKey: string): Promise<boolean>;
    getNumericLimit(userId: string, featureKey: string): Promise<number>;
    invalidate(userId: string): Promise<void>;
}
