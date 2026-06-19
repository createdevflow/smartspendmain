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
exports.PassbookService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto_service_1 = require("../crypto/crypto.service");
let PassbookService = class PassbookService {
    constructor(prisma, crypto) {
        this.prisma = prisma;
        this.crypto = crypto;
    }
    async generatePdf(userId, cashbookId, month) {
        const tx = await this.getTransactions(userId, cashbookId, month);
        return Buffer.from('%PDF-1.4\n%Stub PDF content for Cashtro Passbook');
    }
    async generateCsv(userId, cashbookId, month) {
        const tx = await this.getTransactions(userId, cashbookId, month);
        let csv = 'Date,Type,Category,Amount,Currency,Merchant,Notes\n';
        tx.forEach(t => {
            csv += `${t.date.toISOString().split('T')[0]},${t.type},${t.category?.name || ''},${t.amount},${t.currency},"${t.merchant || ''}","${t.notes || ''}"\n`;
        });
        return csv;
    }
    async getTransactions(userId, cashbookId, month) {
        const salt = (await this.prisma.user.findUnique({ where: { id: userId }, select: { encryptionKeySalt: true } }))?.encryptionKeySalt || '';
        const [year, m] = month.split('-');
        const start = new Date(parseInt(year), parseInt(m) - 1, 1);
        const end = new Date(parseInt(year), parseInt(m), 0, 23, 59, 59);
        const txs = await this.prisma.transaction.findMany({
            where: { userId, ...(cashbookId ? { cashbookId } : {}), date: { gte: start, lte: end }, deletedAt: null },
            orderBy: { date: 'asc' },
            include: { category: true },
        });
        return txs.map(tx => ({
            ...tx,
            notes: tx.encNotes ? this.crypto.decrypt(tx.encNotes, salt) : null,
            merchant: tx.encMerchant ? this.crypto.decrypt(tx.encMerchant, salt) : null,
        }));
    }
};
exports.PassbookService = PassbookService;
exports.PassbookService = PassbookService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, crypto_service_1.CryptoService])
], PassbookService);
//# sourceMappingURL=passbook.service.js.map