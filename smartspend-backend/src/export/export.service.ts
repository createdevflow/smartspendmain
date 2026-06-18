import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';

@Injectable()
export class ExportService {
  constructor(
    private prisma: PrismaService,
    private crypto: CryptoService,
  ) {}

  // ── Check feature is globally enabled ─────────────────────────────────────
  private async assertFeatureEnabled() {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: 'feature_tax_export_active' },
    });
    // If setting doesn't exist or is explicitly true, allow it
    if (setting?.value === 'false') {
      throw new ForbiddenException('Tax export feature is currently disabled by admin');
    }
  }

  // ── Generate Tax Report CSV ────────────────────────────────────────────────
  async generateTaxReport(userId: string, year: number): Promise<{ csv: string; summary: any }> {
    await this.assertFeatureEnabled();

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true, email: true, encryptionKeySalt: true, defaultCurrency: true },
    });
    const salt = user?.encryptionKeySalt || '';

    // Fetch all TAX_DEDUCTIBLE transactions for the year
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

    // Decrypt merchant/notes
    const decrypted = transactions.map(tx => ({
      ...tx,
      merchant: tx.encMerchant ? this.crypto.decrypt(tx.encMerchant, salt) : 'N/A',
      notes: tx.encNotes ? this.crypto.decrypt(tx.encNotes, salt) : '',
    }));

    // Build CSV
    const csvRows = [
      ['Date', 'Merchant', 'Category', 'Amount', 'Currency', 'Payment Method', 'Notes', 'Receipt URL'],
    ];

    let totalAmount = 0;
    const categoryMap: Record<string, number> = {};

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

    const csv = csvRows.map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    // Log the export
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
}
