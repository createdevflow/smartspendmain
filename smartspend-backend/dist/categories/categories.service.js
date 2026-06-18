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
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CategoriesService = class CategoriesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(userId, type) {
        return this.prisma.category.findMany({
            where: {
                OR: [{ userId: null }, { userId }],
                ...(type ? { type: { in: [type, 'both'] } } : {}),
            },
            orderBy: [{ isSystem: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
            include: { children: { orderBy: { sortOrder: 'asc' } } },
        });
    }
    async create(userId, dto) {
        const slug = `${dto.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${userId.slice(-4)}`;
        const existing = await this.prisma.category.findFirst({ where: { slug, userId } });
        if (existing)
            throw new common_1.ConflictException('A category with this name already exists');
        return this.prisma.category.create({
            data: { ...dto, userId, slug, isSystem: false },
        });
    }
    async update(userId, id, dto) {
        const cat = await this.prisma.category.findFirst({ where: { id, userId } });
        if (!cat)
            throw new common_1.NotFoundException('Category not found');
        if (cat.isSystem)
            throw new common_1.ForbiddenException('System categories cannot be modified');
        return this.prisma.category.update({ where: { id }, data: dto });
    }
    async remove(userId, id) {
        const cat = await this.prisma.category.findFirst({ where: { id, userId } });
        if (!cat)
            throw new common_1.NotFoundException('Category not found');
        if (cat.isSystem)
            throw new common_1.ForbiddenException('System categories cannot be deleted');
        const other = await this.prisma.category.findFirst({
            where: { isSystem: true, slug: cat.type === 'income' ? 'other-income' : 'other-expense' },
        });
        if (other) {
            await this.prisma.transaction.updateMany({
                where: { categoryId: id },
                data: { categoryId: other.id },
            });
        }
        await this.prisma.category.delete({ where: { id } });
        return { message: 'Category deleted' };
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map