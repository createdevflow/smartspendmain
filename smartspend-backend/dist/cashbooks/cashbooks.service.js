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
exports.CashbooksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto_service_1 = require("../crypto/crypto.service");
const features_service_1 = require("../plans/features.service");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
let CashbooksService = class CashbooksService {
    constructor(prisma, crypto, features, audit) {
        this.prisma = prisma;
        this.crypto = crypto;
        this.features = features;
        this.audit = audit;
    }
    async getSalt(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { encryptionKeySalt: true } });
        return user?.encryptionKeySalt || '';
    }
    async findAll(userId, archived = false) {
        const salt = await this.getSalt(userId);
        const ownedBooks = await this.prisma.cashbook.findMany({
            where: { userId, isArchived: archived, deletedAt: null },
            orderBy: [{ isDefault: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
        });
        const memberEntries = await this.prisma.cashbookMember.findMany({
            where: { userId, status: 'accepted' },
        });
        const sharedCashbookIds = memberEntries.map(m => m.cashbookId);
        const sharedCashbooksRaw = sharedCashbookIds.length > 0
            ? await this.prisma.cashbook.findMany({
                where: { id: { in: sharedCashbookIds }, isArchived: archived, deletedAt: null },
            })
            : [];
        const memberRoleMap = {};
        memberEntries.forEach(m => { memberRoleMap[m.cashbookId] = m.role; });
        const sharedBooks = sharedCashbooksRaw.map(b => ({ ...b, memberRole: memberRoleMap[b.id] || 'VIEWER', isShared: true }));
        const allBooks = [
            ...ownedBooks.map(b => ({ ...b, memberRole: 'OWNER', isShared: false })),
            ...sharedBooks,
        ];
        return Promise.all(allBooks.map(async (book) => {
            let decryptSalt = salt;
            if (book.isShared) {
                const ownerSalt = await this.getSalt(book.userId);
                decryptSalt = ownerSalt;
            }
            const { income, expense } = await this.getBalance(book.userId, book.id);
            return {
                ...book,
                name: this.crypto.decrypt(book.name, decryptSalt),
                description: book.description ? this.crypto.decrypt(book.description, decryptSalt) : null,
                balance: (Number(book.openingBalance) + income - expense).toFixed(2),
                income: income.toFixed(2),
                expense: expense.toFixed(2),
            };
        }));
    }
    async findOne(userId, id) {
        const book = await this.prisma.cashbook.findFirst({ where: { id, userId, deletedAt: null } });
        if (!book)
            throw new common_1.NotFoundException('Cashbook not found');
        const salt = await this.getSalt(userId);
        const { income, expense } = await this.getBalance(userId, id);
        return {
            ...book,
            name: this.crypto.decrypt(book.name, salt),
            description: book.description ? this.crypto.decrypt(book.description, salt) : null,
            balance: (Number(book.openingBalance) + income - expense).toFixed(2),
        };
    }
    async create(userId, dto) {
        const limit = await this.features.getNumericLimit(userId, 'max_cashbooks');
        if (limit !== Infinity) {
            const count = await this.prisma.cashbook.count({ where: { userId, isArchived: false, deletedAt: null } });
            if (count >= limit) {
                throw new common_1.ForbiddenException({
                    code: 'PLAN_LIMIT_REACHED',
                    feature: 'max_cashbooks',
                    message: `You can have at most ${limit} cashbooks on your current plan`,
                });
            }
        }
        const salt = await this.getSalt(userId);
        const book = await this.prisma.cashbook.create({
            data: {
                userId,
                name: this.crypto.encrypt(dto.name, salt),
                description: dto.description ? this.crypto.encrypt(dto.description, salt) : null,
                color: dto.color || '#2563EB',
                icon: dto.icon || 'wallet',
                currency: dto.currency || 'INR',
                openingBalance: dto.openingBalance || 0,
            },
        });
        await this.audit.log({ userId, action: client_1.AuditAction.CASHBOOK_CREATED, entityId: book.id });
        return { ...book, name: dto.name, description: dto.description };
    }
    async update(userId, id, dto) {
        const book = await this.prisma.cashbook.findFirst({ where: { id, userId, deletedAt: null } });
        if (!book)
            throw new common_1.NotFoundException('Cashbook not found');
        const salt = await this.getSalt(userId);
        return this.prisma.cashbook.update({
            where: { id },
            data: {
                ...(dto.name ? { name: this.crypto.encrypt(dto.name, salt) } : {}),
                ...(dto.description !== undefined ? { description: dto.description ? this.crypto.encrypt(dto.description, salt) : null } : {}),
                ...(dto.color ? { color: dto.color } : {}),
                ...(dto.icon ? { icon: dto.icon } : {}),
                ...(dto.isArchived !== undefined ? { isArchived: dto.isArchived } : {}),
            },
        });
    }
    async remove(userId, id) {
        const book = await this.prisma.cashbook.findFirst({ where: { id, userId, deletedAt: null } });
        if (!book)
            throw new common_1.NotFoundException('Cashbook not found');
        if (book.isDefault)
            throw new common_1.ForbiddenException('Cannot delete the default cashbook');
        await this.prisma.cashbook.update({ where: { id }, data: { deletedAt: new Date() } });
        await this.audit.log({ userId, action: client_1.AuditAction.CASHBOOK_DELETED, entityId: id });
        return { message: 'Cashbook deleted' };
    }
    async reorder(userId, orderedIds) {
        await Promise.all(orderedIds.map((id, index) => this.prisma.cashbook.updateMany({ where: { id, userId }, data: { sortOrder: index } })));
        return { message: 'Order updated' };
    }
    async getBalance(userId, cashbookId) {
        const [incomeAgg, expenseAgg] = await Promise.all([
            this.prisma.transaction.aggregate({
                where: { cashbookId, userId, type: 'INCOME', deletedAt: null },
                _sum: { amountInBookCurrency: true },
            }),
            this.prisma.transaction.aggregate({
                where: { cashbookId, userId, type: 'EXPENSE', deletedAt: null },
                _sum: { amountInBookCurrency: true },
            }),
        ]);
        return {
            income: Number(incomeAgg._sum.amountInBookCurrency || 0),
            expense: Number(expenseAgg._sum.amountInBookCurrency || 0),
        };
    }
};
exports.CashbooksService = CashbooksService;
exports.CashbooksService = CashbooksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        crypto_service_1.CryptoService,
        features_service_1.FeaturesService,
        audit_service_1.AuditService])
], CashbooksService);
//# sourceMappingURL=cashbooks.service.js.map