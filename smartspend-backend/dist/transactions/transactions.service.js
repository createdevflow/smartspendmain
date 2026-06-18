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
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto_service_1 = require("../crypto/crypto.service");
const currency_service_1 = require("../currency/currency.service");
const categorization_service_1 = require("../categories/categorization.service");
const features_service_1 = require("../plans/features.service");
let TransactionsService = class TransactionsService {
    constructor(prisma, crypto, currency, categorization, features) {
        this.prisma = prisma;
        this.crypto = crypto;
        this.currency = currency;
        this.categorization = categorization;
        this.features = features;
    }
    async getSalt(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId }, select: { encryptionKeySalt: true },
        });
        return user?.encryptionKeySalt || '';
    }
    async findAll(userId, query) {
        const { cashbookId, type, categoryId, from, to, q, paymentMethod, labels, minAmount, maxAmount, page = 1, limit = 20, sortBy = 'date', sortOrder = 'desc', } = query;
        const skip = (page - 1) * limit;
        const where = {
            userId,
            deletedAt: null,
            ...(cashbookId ? { cashbookId } : {}),
            ...(type ? { type } : {}),
            ...(categoryId ? { categoryId } : {}),
            ...(paymentMethod ? { paymentMethod } : {}),
            ...(from || to ? { date: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {}),
            ...(minAmount || maxAmount ? { amount: { ...(minAmount ? { gte: Number(minAmount) } : {}), ...(maxAmount ? { lte: Number(maxAmount) } : {}) } } : {}),
            ...(labels?.length ? { labels: { hasSome: labels } } : {}),
        };
        const [transactions, total] = await this.prisma.$transaction([
            this.prisma.transaction.findMany({
                where, skip, take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    category: { select: { id: true, name: true, emoji: true, color: true } },
                    cashbook: { select: { id: true, name: true, currency: true } },
                },
            }),
            this.prisma.transaction.count({ where }),
        ]);
        const salt = await this.getSalt(userId);
        const decrypted = transactions.map(tx => this.decryptTransaction(tx, salt));
        return {
            data: decrypted,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async findOne(userId, id) {
        const tx = await this.prisma.transaction.findFirst({
            where: { id, userId, deletedAt: null },
            include: {
                category: true,
                cashbook: true,
                splits: true,
            },
        });
        if (!tx)
            throw new common_1.NotFoundException('Transaction not found');
        const salt = await this.getSalt(userId);
        return this.decryptTransaction(tx, salt);
    }
    async create(userId, dto) {
        const salt = await this.getSalt(userId);
        const cashbook = await this.prisma.cashbook.findFirst({
            where: { id: dto.cashbookId, userId, deletedAt: null },
        });
        if (!cashbook)
            throw new common_1.NotFoundException('Cashbook not found');
        const monthlyLimit = await this.features.getNumericLimit(userId, 'max_transactions_monthly');
        if (monthlyLimit !== Infinity) {
            const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            const count = await this.prisma.transaction.count({
                where: { userId, createdAt: { gte: startOfMonth }, deletedAt: null },
            });
            if (count >= monthlyLimit) {
                throw new common_1.ForbiddenException({
                    code: 'PLAN_LIMIT_REACHED',
                    feature: 'max_transactions_monthly',
                    message: `You've reached your monthly transaction limit (${monthlyLimit}). Upgrade your plan for more.`,
                });
            }
        }
        let categoryId = dto.categoryId;
        let autoDetected = false;
        if (!categoryId && (dto.merchant || dto.notes)) {
            const suggested = await this.categorization.suggest(userId, dto.merchant, dto.notes);
            if (suggested) {
                categoryId = suggested;
                autoDetected = true;
            }
        }
        let amountInBookCurrency = dto.amount;
        let exchangeRate;
        if (dto.currency !== cashbook.currency) {
            amountInBookCurrency = await this.currency.convert(dto.amount, dto.currency, cashbook.currency);
            exchangeRate = amountInBookCurrency / dto.amount;
        }
        const labels = [...(dto.labels || [])];
        if (dto.isRecurring)
            labels.push('RECURRING');
        if (dto.isGstApplied)
            labels.push('GST_APPLIED');
        if (dto.isTaxDeductible && dto.type === 'EXPENSE')
            labels.push('TAX_DEDUCTIBLE');
        const encNotes = dto.notes ? this.crypto.encrypt(dto.notes, salt) : null;
        const encMerchant = dto.merchant ? this.crypto.encrypt(dto.merchant, salt) : null;
        const tx = await this.prisma.transaction.create({
            data: {
                userId, cashbookId: dto.cashbookId, categoryId,
                amount: dto.amount, currency: dto.currency,
                exchangeRate, amountInBookCurrency,
                encNotes, encMerchant,
                type: dto.type, paymentMethod: dto.paymentMethod,
                date: new Date(dto.date),
                labels: labels,
                tags: dto.tags || [],
                isGstApplied: dto.isGstApplied || false,
                gstRate: dto.gstRate, cgst: dto.cgst, sgst: dto.sgst, igst: dto.igst,
                localId: dto.localId,
                syncedAt: new Date(),
            },
            include: { category: true, cashbook: { select: { id: true, name: true } } },
        });
        if (dto.merchant && categoryId) {
            await this.categorization.learnMapping(userId, dto.merchant, categoryId);
        }
        return { ...this.decryptTransaction(tx, salt), autoDetectedCategory: autoDetected };
    }
    async update(userId, id, dto) {
        const tx = await this.prisma.transaction.findFirst({ where: { id, userId, deletedAt: null } });
        if (!tx)
            throw new common_1.NotFoundException('Transaction not found');
        const salt = await this.getSalt(userId);
        const encNotes = dto.notes !== undefined ? this.crypto.encrypt(dto.notes, salt) : undefined;
        const encMerchant = dto.merchant !== undefined ? this.crypto.encrypt(dto.merchant, salt) : undefined;
        if (dto.merchant && dto.categoryId) {
            await this.categorization.learnMapping(userId, dto.merchant, dto.categoryId);
        }
        const updated = await this.prisma.transaction.update({
            where: { id },
            data: {
                ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
                ...(dto.currency ? { currency: dto.currency } : {}),
                ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
                ...(dto.type ? { type: dto.type } : {}),
                ...(dto.paymentMethod !== undefined ? { paymentMethod: dto.paymentMethod } : {}),
                ...(dto.date ? { date: new Date(dto.date) } : {}),
                ...(encNotes !== undefined ? { encNotes } : {}),
                ...(encMerchant !== undefined ? { encMerchant } : {}),
                ...(dto.labels ? { labels: dto.labels } : {}),
                ...(dto.tags ? { tags: dto.tags } : {}),
            },
            include: { category: true },
        });
        return this.decryptTransaction(updated, salt);
    }
    async remove(userId, id) {
        const tx = await this.prisma.transaction.findFirst({ where: { id, userId, deletedAt: null } });
        if (!tx)
            throw new common_1.NotFoundException('Transaction not found');
        await this.prisma.transaction.update({ where: { id }, data: { deletedAt: new Date() } });
        return { message: 'Transaction deleted' };
    }
    async bulkDelete(userId, ids) {
        const result = await this.prisma.transaction.updateMany({
            where: { id: { in: ids }, userId, deletedAt: null },
            data: { deletedAt: new Date() },
        });
        return { deleted: result.count };
    }
    async bulkImport(userId, transactions) {
        const results = { created: 0, skipped: 0, errors: [] };
        for (const dto of transactions) {
            try {
                if (dto.localId) {
                    const existing = await this.prisma.transaction.findFirst({
                        where: { userId, localId: dto.localId },
                    });
                    if (existing) {
                        results.skipped++;
                        continue;
                    }
                }
                await this.create(userId, dto);
                results.created++;
            }
            catch (err) {
                results.errors.push(`${dto.localId || '?'}: ${err.message}`);
            }
        }
        return results;
    }
    async search(userId, q) {
        if (!q || q.length < 2)
            return [];
        const results = await this.prisma.transaction.findMany({
            where: {
                userId, deletedAt: null,
                OR: [
                    { tags: { has: q.toLowerCase() } },
                    { category: { name: { contains: q, mode: 'insensitive' } } },
                ],
            },
            take: 50,
            orderBy: { date: 'desc' },
            include: { category: true },
        });
        const salt = await this.getSalt(userId);
        return results.map(tx => this.decryptTransaction(tx, salt));
    }
    decryptTransaction(tx, salt) {
        return {
            ...tx,
            notes: tx.encNotes ? this.crypto.decrypt(tx.encNotes, salt) : null,
            merchant: tx.encMerchant ? this.crypto.decrypt(tx.encMerchant, salt) : null,
            encNotes: undefined,
            encMerchant: undefined,
        };
    }
    async scanReceiptMock(userId, imageBase64) {
        const featureEnabled = await this.prisma.systemSetting.findUnique({ where: { key: 'feature_ocr_active' } });
        if (featureEnabled?.value !== 'true') {
            throw new common_1.ForbiddenException('Receipt scanning is currently disabled globally.');
        }
        await new Promise(resolve => setTimeout(resolve, 1500));
        const warrantyDate = new Date();
        warrantyDate.setFullYear(warrantyDate.getFullYear() + 1);
        return {
            success: true,
            parsedData: {
                amount: 2499.00,
                merchant: 'Best Buy',
                date: new Date().toISOString(),
                categorySuggestion: 'Electronics',
                hasWarranty: true,
                warrantyUntil: warrantyDate.toISOString(),
                notes: 'Sony Headphones (1 Year Warranty)',
            }
        };
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        crypto_service_1.CryptoService,
        currency_service_1.CurrencyService,
        categorization_service_1.CategorizationService,
        features_service_1.FeaturesService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map