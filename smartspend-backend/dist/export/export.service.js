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
exports.ExportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto_service_1 = require("../crypto/crypto.service");
let ExportService = class ExportService {
    constructor(prisma, crypto) {
        this.prisma = prisma;
        this.crypto = crypto;
    }
    async assertFeatureEnabled() {
        const setting = await this.prisma.systemSetting.findUnique({
            where: { key: 'feature_tax_export_active' },
        });
        if (setting?.value === 'false') {
            throw new common_1.ForbiddenException('Tax export feature is currently disabled by admin');
        }
    }
    async generateTaxReport(userId, year) {
        await this.assertFeatureEnabled();
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { fullName: true, email: true, encryptionKeySalt: true, defaultCurrency: true },
        });
        const salt = user?.encryptionKeySalt || '';
        const transactions = await this.prisma.transaction.findMany({
            where: {
                userId,
                type: 'EXPENSE',
                labels: { has: 'TAX_DEDUCTIBLE' },
                date: { gte: startDate, lte: endDate },
                deletedAt: null,
            },
            include: {
                category: { select: { name: true, emoji: true } },
                cashbook: { select: { name: true, currency: true } },
            },
            orderBy: { date: 'asc' },
        });
        const decrypted = transactions.map(tx => ({
            ...tx,
            merchant: tx.encMerchant ? this.crypto.decrypt(tx.encMerchant, salt) : 'N/A',
            notes: tx.encNotes ? this.crypto.decrypt(tx.encNotes, salt) : '',
        }));
        const csvRows = [
            ['Date', 'Merchant', 'Category', 'Amount', 'Currency', 'Payment Method', 'Notes', 'Receipt URL'],
        ];
        let totalAmount = 0;
        const categoryMap = {};
        for (const tx of decrypted) {
            const amount = Number(tx.amount);
            totalAmount += amount;
            const catName = tx.category?.name || 'Uncategorized';
            categoryMap[catName] = (categoryMap[catName] || 0) + amount;
            csvRows.push([
                new Date(tx.date).toISOString().split('T')[0],
                tx.merchant || 'N/A',
                catName,
                amount.toFixed(2),
                tx.currency,
                tx.paymentMethod || 'N/A',
                tx.notes || '',
                tx.receiptUrl || '',
            ]);
        }
        const csv = csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
        await this.prisma.taxExportLog.create({
            data: {
                userId,
                year,
                txCount: transactions.length,
                totalAmount,
            },
        });
        return {
            csv,
            summary: {
                year,
                userName: user?.fullName,
                userEmail: user?.email,
                currency: user?.defaultCurrency || 'INR',
                totalTransactions: transactions.length,
                totalDeductibleAmount: totalAmount.toFixed(2),
                byCategory: categoryMap,
                generatedAt: new Date().toISOString(),
            },
        };
    }
};
exports.ExportService = ExportService;
exports.ExportService = ExportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        crypto_service_1.CryptoService])
], ExportService);
//# sourceMappingURL=export.service.js.map