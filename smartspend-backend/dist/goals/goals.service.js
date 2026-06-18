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
exports.GoalsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto_service_1 = require("../crypto/crypto.service");
let GoalsService = class GoalsService {
    constructor(prisma, crypto) {
        this.prisma = prisma;
        this.crypto = crypto;
    }
    async getSalt(userId) {
        const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { encryptionKeySalt: true } });
        return u?.encryptionKeySalt || '';
    }
    async findAll(userId) {
        const salt = await this.getSalt(userId);
        const goals = await this.prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
        return goals.map(g => ({ ...g, name: this.crypto.decrypt(g.name, salt), description: g.description ? this.crypto.decrypt(g.description, salt) : null }));
    }
    async findOne(userId, id) {
        const g = await this.prisma.goal.findFirst({ where: { id, userId }, include: { contributions: { orderBy: { createdAt: 'desc' }, take: 5 } } });
        if (!g)
            throw new common_1.NotFoundException('Goal not found');
        const salt = await this.getSalt(userId);
        return { ...g, name: this.crypto.decrypt(g.name, salt), description: g.description ? this.crypto.decrypt(g.description, salt) : null };
    }
    async create(userId, dto) {
        const salt = await this.getSalt(userId);
        return this.prisma.goal.create({
            data: { userId, ...dto, name: this.crypto.encrypt(dto.name, salt), description: dto.description ? this.crypto.encrypt(dto.description, salt) : null, deadline: dto.deadline ? new Date(dto.deadline) : null },
        });
    }
    async update(userId, id, dto) {
        const g = await this.prisma.goal.findFirst({ where: { id, userId } });
        if (!g)
            throw new common_1.NotFoundException('Goal not found');
        const salt = await this.getSalt(userId);
        return this.prisma.goal.update({ where: { id }, data: { ...dto, ...(dto.name ? { name: this.crypto.encrypt(dto.name, salt) } : {}), ...(dto.description ? { description: this.crypto.encrypt(dto.description, salt) } : {}) } });
    }
    async remove(userId, id) {
        const g = await this.prisma.goal.findFirst({ where: { id, userId } });
        if (!g)
            throw new common_1.NotFoundException('Goal not found');
        await this.prisma.goal.delete({ where: { id } });
        return { message: 'Goal deleted' };
    }
    async contribute(userId, goalId, dto) {
        const g = await this.prisma.goal.findFirst({ where: { id: goalId, userId } });
        if (!g)
            throw new common_1.NotFoundException('Goal not found');
        const [contribution] = await this.prisma.$transaction([
            this.prisma.goalContribution.create({ data: { goalId, amount: dto.amount, note: dto.note } }),
            this.prisma.goal.update({ where: { id: goalId }, data: { currentAmount: { increment: dto.amount } } }),
        ]);
        const updated = await this.prisma.goal.findUnique({ where: { id: goalId } });
        if (updated && Number(updated.currentAmount) >= Number(updated.targetAmount) && updated.status === 'ACTIVE') {
            await this.prisma.goal.update({ where: { id: goalId }, data: { status: 'COMPLETED' } });
        }
        return contribution;
    }
    async getHistory(userId, goalId) {
        const g = await this.prisma.goal.findFirst({ where: { id: goalId, userId } });
        if (!g)
            throw new common_1.NotFoundException('Goal not found');
        return this.prisma.goalContribution.findMany({ where: { goalId }, orderBy: { createdAt: 'desc' } });
    }
};
exports.GoalsService = GoalsService;
exports.GoalsService = GoalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, crypto_service_1.CryptoService])
], GoalsService);
//# sourceMappingURL=goals.service.js.map