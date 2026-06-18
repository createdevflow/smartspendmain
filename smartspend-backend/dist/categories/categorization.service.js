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
exports.CategorizationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const cache_service_1 = require("../cache/cache.service");
let CategorizationService = class CategorizationService {
    constructor(prisma, cache) {
        this.prisma = prisma;
        this.cache = cache;
    }
    async suggest(userId, merchant, notes) {
        const text = [merchant, notes]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .trim();
        if (!text)
            return null;
        const personal = await this.prisma.userMerchantMapping.findFirst({
            where: {
                userId,
                merchant: { contains: text.split(' ')[0], mode: 'insensitive' },
            },
            orderBy: { usageCount: 'desc' },
        });
        if (personal)
            return personal.categoryId;
        const rules = await this.getKeywordRules();
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
            if (matched)
                return rule.categoryId;
        }
        return null;
    }
    async suggestWithDetails(userId, merchant, notes) {
        const categoryId = await this.suggest(userId, merchant, notes);
        if (!categoryId)
            return null;
        const category = await this.prisma.category.findUnique({
            where: { id: categoryId },
            select: { id: true, name: true, emoji: true, color: true },
        });
        return category;
    }
    async learnMapping(userId, merchant, categoryId) {
        if (!merchant?.trim())
            return;
        const normalizedMerchant = merchant.toLowerCase().trim().split(' ')[0];
        await this.prisma.userMerchantMapping.upsert({
            where: { userId_merchant: { userId, merchant: normalizedMerchant } },
            create: { userId, merchant: normalizedMerchant, categoryId },
            update: { categoryId, usageCount: { increment: 1 } },
        });
    }
    async invalidateRulesCache() {
        await this.cache.del('category:keyword:rules');
    }
    async getKeywordRules() {
        const cached = await this.cache.get('category:keyword:rules');
        if (cached)
            return cached;
        const rules = await this.prisma.categoryKeyword.findMany({
            select: { categoryId: true, keyword: true, matchType: true, priority: true },
            orderBy: { priority: 'desc' },
        });
        await this.cache.set('category:keyword:rules', rules, 3600);
        return rules;
    }
};
exports.CategorizationService = CategorizationService;
exports.CategorizationService = CategorizationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, cache_service_1.CacheService])
], CategorizationService);
//# sourceMappingURL=categorization.service.js.map