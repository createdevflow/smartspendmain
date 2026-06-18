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
exports.PlansService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const features_service_1 = require("./features.service");
let PlansService = class PlansService {
    constructor(prisma, features) {
        this.prisma = prisma;
        this.features = features;
    }
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
    async findBySlug(slug) {
        const plan = await this.prisma.plan.findUnique({
            where: { slug },
            include: { features: { include: { feature: true } } },
        });
        if (!plan)
            throw new common_1.NotFoundException('Plan not found');
        return plan;
    }
    async getUserPlan(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { plan: { include: { features: { include: { feature: true } } } } },
        });
        const featureMap = await this.features.getUserFeatures(userId);
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
    async subscribeToPlan(userId, planId) {
        const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
        if (!plan || !plan.isActive)
            throw new common_1.NotFoundException('Active plan not found');
        await this.prisma.user.update({
            where: { id: userId },
            data: { planId: plan.id },
        });
        return { message: `Successfully subscribed to ${plan.name} plan`, plan };
    }
};
exports.PlansService = PlansService;
exports.PlansService = PlansService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, features_service_1.FeaturesService])
], PlansService);
//# sourceMappingURL=plans.service.js.map