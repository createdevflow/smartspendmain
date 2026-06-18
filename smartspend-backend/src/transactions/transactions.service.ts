import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { CurrencyService } from '../currency/currency.service';
import { CategorizationService } from '../categories/categorization.service';
import { FeaturesService } from '../plans/features.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { TransactionLabel } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private crypto: CryptoService,
    private currency: CurrencyService,
    private categorization: CategorizationService,
    private features: FeaturesService,
  ) {}

  // ── Get user's encryption key salt ─────────────────────────────────────────
  private async getSalt(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }, select: { encryptionKeySalt: true },
    });
    return user?.encryptionKeySalt || '';
  }

  // ── Find All (with filters) ─────────────────────────────────────────────────
  async findAll(userId: string, query: TransactionQueryDto) {
    const {
      cashbookId, type, categoryId, from, to, q,
      paymentMethod, labels, minAmount, maxAmount,
      page = 1, limit = 20, sortBy = 'date', sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {
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

    // Decrypt sensitive fields
    const decrypted = transactions.map(tx => this.decryptTransaction(tx, salt));

    return {
      data: decrypted,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Find One ────────────────────────────────────────────────────────────────
  async findOne(userId: string, id: string) {
    const tx = await this.prisma.transaction.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        category: true,
        cashbook: true,
        splits: true,
      },
    });
    if (!tx) throw new NotFoundException('Transaction not found');
    const salt = await this.getSalt(userId);
    return this.decryptTransaction(tx, salt);
  }

  // ── Create ──────────────────────────────────────────────────────────────────
  async create(userId: string, dto: CreateTransactionDto) {
    const salt = await this.getSalt(userId);

    // Verify cashbook ownership
    const cashbook = await this.prisma.cashbook.findFirst({
      where: { id: dto.cashbookId, userId, deletedAt: null },
    });
    if (!cashbook) throw new NotFoundException('Cashbook not found');

    // Plan: check monthly transaction limit
    const monthlyLimit = await this.features.getNumericLimit(userId, 'max_transactions_monthly');
    if (monthlyLimit !== Infinity) {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const count = await this.prisma.transaction.count({
        where: { userId, createdAt: { gte: startOfMonth }, deletedAt: null },
      });
      if (count >= monthlyLimit) {
        throw new ForbiddenException({
          code: 'PLAN_LIMIT_REACHED',
          feature: 'max_transactions_monthly',
          message: `You've reached your monthly transaction limit (${monthlyLimit}). Upgrade your plan for more.`,
        });
      }
    }

    // Auto-categorize if no category provided
    let categoryId = dto.categoryId;
    let autoDetected = false;
    if (!categoryId && (dto.merchant || dto.notes)) {
      const suggested = await this.categorization.suggest(userId, dto.merchant, dto.notes);
      if (suggested) { categoryId = suggested; autoDetected = true; }
    }

    // Currency conversion
    let amountInBookCurrency = dto.amount;
    let exchangeRate: number | undefined;
    if (dto.currency !== cashbook.currency) {
      amountInBookCurrency = await this.currency.convert(dto.amount, dto.currency, cashbook.currency);
      exchangeRate = amountInBookCurrency / dto.amount;
    }

    // Detect labels automatically
    const labels = [...(dto.labels || [])];
    if (dto.isRecurring) labels.push('RECURRING' as TransactionLabel);
    if (dto.isGstApplied) labels.push('GST_APPLIED' as TransactionLabel);
    if ((dto as any).isTaxDeductible && dto.type === 'EXPENSE') labels.push('TAX_DEDUCTIBLE' as TransactionLabel);

    // Encrypt sensitive fields
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
        labels: labels as TransactionLabel[],
        tags: dto.tags || [],
        isGstApplied: dto.isGstApplied || false,
        gstRate: dto.gstRate, cgst: dto.cgst, sgst: dto.sgst, igst: dto.igst,
        localId: dto.localId,
        syncedAt: new Date(),
      },
      include: { category: true, cashbook: { select: { id: true, name: true } } },
    });

    // Learn merchant→category for future auto-categorization
    if (dto.merchant && categoryId) {
      await this.categorization.learnMapping(userId, dto.merchant, categoryId);
    }

    return { ...this.decryptTransaction(tx, salt), autoDetectedCategory: autoDetected };
  }

  // ── Update ──────────────────────────────────────────────────────────────────
  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    const tx = await this.prisma.transaction.findFirst({ where: { id, userId, deletedAt: null } });
    if (!tx) throw new NotFoundException('Transaction not found');
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
        ...(dto.labels ? { labels: dto.labels as TransactionLabel[] } : {}),
        ...(dto.tags ? { tags: dto.tags } : {}),
      },
      include: { category: true },
    });

    return this.decryptTransaction(updated, salt);
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  async remove(userId: string, id: string) {
    const tx = await this.prisma.transaction.findFirst({ where: { id, userId, deletedAt: null } });
    if (!tx) throw new NotFoundException('Transaction not found');
    await this.prisma.transaction.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Transaction deleted' };
  }

  // ── Bulk Delete ─────────────────────────────────────────────────────────────
  async bulkDelete(userId: string, ids: string[]) {
    const result = await this.prisma.transaction.updateMany({
      where: { id: { in: ids }, userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return { deleted: result.count };
  }

  // ── Bulk Import (offline sync) ──────────────────────────────────────────────
  async bulkImport(userId: string, transactions: CreateTransactionDto[]) {
    const results = { created: 0, skipped: 0, errors: [] as string[] };

    for (const dto of transactions) {
      try {
        // Skip if already exists (dedup by localId)
        if (dto.localId) {
          const existing = await this.prisma.transaction.findFirst({
            where: { userId, localId: dto.localId },
          });
          if (existing) { results.skipped++; continue; }
        }
        await this.create(userId, dto);
        results.created++;
      } catch (err) {
        results.errors.push(`${dto.localId || '?'}: ${err.message}`);
      }
    }
    return results;
  }

  // ── Search ──────────────────────────────────────────────────────────────────
  async search(userId: string, q: string) {
    if (!q || q.length < 2) return [];
    // Search is done on decrypted notes — for privacy, search on tags and category
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

  // ── Decrypt helper ─────────────────────────────────────────────────────────
  private decryptTransaction(tx: any, salt: string) {
    return {
      ...tx,
      notes: tx.encNotes ? this.crypto.decrypt(tx.encNotes, salt) : null,
      merchant: tx.encMerchant ? this.crypto.decrypt(tx.encMerchant, salt) : null,
      encNotes: undefined,
      encMerchant: undefined,
    };
  }

  // ── Mock OCR Scanner ───────────────────────────────────────────────────────
  async scanReceiptMock(userId: string, imageBase64: string) {
    // Check if feature is enabled globally
    const featureEnabled = await this.prisma.systemSetting.findUnique({ where: { key: 'feature_ocr_active' } });
    if (featureEnabled?.value !== 'true') {
      throw new ForbiddenException('Receipt scanning is currently disabled globally.');
    }

    // In a real app, we'd send imageBase64 to OpenAI Vision API or AWS Textract
    // Mock response parsing:
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Return a mocked parsed receipt
    const warrantyDate = new Date();
    warrantyDate.setFullYear(warrantyDate.getFullYear() + 1); // 1 year warranty

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
}
