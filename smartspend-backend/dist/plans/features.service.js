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
exports.FeaturesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const cache_service_1 = require("../cache/cache.service");
let FeaturesService = class FeaturesService {
    constructor(prisma, cache) {
        this.prisma = prisma;
        this.cache = cache;
    }
    async getUserFeatures(userId) {
        const cacheKey = `user:features:${userId}`;
        const cached = await this.cache.get(cacheKey);
        if (cached)
            return cached;
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                plan: { include: { features: { include: { feature: true } } } },
            },
        });
        const allFeatures = await this.prisma.feature.findMany();
        const features = {};
        for (const f of allFeatures)
            features[f.key] = f.defaultValue;
        if (user?.plan?.features) {
            for (const pf of user.plan.features) {
                features[pf.feature.key] = pf.value;
            }
        }
        await this.cache.set(cacheKey, features, 300);
        return features;
    }
    async check(userId, featureKey) {
        const features = await this.getUserFeatures(userId);
        return features[featureKey] ?? '0';
    }
    async canUse(userId, featureKey) {
        const value = await this.check(userId, featureKey);
        if (value === 'true' || value === '-1')
            return true;
        if (value === 'false' || value === '0')
            return false;
        return Number(value) > 0;
    }
    async getNumericLimit(userId, featureKey) {
        const value = await this.check(userId, featureKey);
        if (value === '-1')
            return Infinity;
        return parseInt(value, 10) || 0;
    }
    async invalidate(userId) {
        await this.cache.del(`user:features:${userId}`);
    }
};
exports.FeaturesService = FeaturesService;
exports.FeaturesService = FeaturesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, cache_service_1.CacheService])
], FeaturesService);
//# sourceMappingURL=features.service.js.map