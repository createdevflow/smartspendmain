import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';

@Injectable()
export class PassbookService {
  constructor(private prisma: PrismaService, private crypto: CryptoService) {}

  async generatePdf(userId: string, cashbookId: string, month: string) {
    // Stub for PDF generation. In production, use PDFKit or Puppeteer to generate a beautiful branded passbook.
    const tx = await this.getTransactions(userId, cashbookId, month);
    return Buffer.from('%PDF-1.4\n%Stub PDF content for SmartSpend Passbook');
  }

  async generateCsv(userId: string, cashbookId: string, month: string) {
    const tx = await this.getTransactions(userId, cashbookId, month);
    let csv = 'Date,Type,Category,Amount,Currency,Merchant,Notes\n';
    tx.forEach(t => {
      csv += `${t.date.toISOString().split('T')[0]},${t.type},${t.category?.name || ''},${t.amount},${t.currency},"${t.merchant || ''}","${t.notes || ''}"\n`;
    });
    return csv;
  }

  private async getTransactions(userId: string, cashbookId: string, month: string) {
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
}
