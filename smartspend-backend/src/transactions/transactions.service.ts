import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
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
    private config: ConfigService,
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
      deletedAt: null,
      OR: [
        { userId },
        { cashbook: { members: { some: { userId, status: 'accepted' } } } },
      ],
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
          cashbook: { select: { id: true, name: true, currency: true, userId: true } },
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    const saltCache: Record<string, string> = { [userId]: await this.getSalt(userId) };

    // Decrypt sensitive fields
    const decrypted = await Promise.all(transactions.map(async tx => {
      const ownerId = tx.cashbook?.userId || tx.userId;
      if (!saltCache[ownerId]) saltCache[ownerId] = await this.getSalt(ownerId);
      return this.decryptTransaction(tx, saltCache[ownerId]);
    }));

    return {
      data: decrypted,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Find One ────────────────────────────────────────────────────────────────
  async findOne(userId: string, id: string) {
    const tx = await this.prisma.transaction.findFirst({
      where: {
        id, deletedAt: null,
        OR: [
          { userId },
          { cashbook: { members: { some: { userId, status: 'accepted' } } } },
        ],
      },
      include: {
        category: true,
        cashbook: true,
        splits: true,
      },
    });
    if (!tx) throw new NotFoundException('Transaction not found');
    const ownerId = tx.cashbook?.userId || tx.userId;
    const salt = ownerId === userId ? await this.getSalt(userId) : await this.getSalt(ownerId);
    return this.decryptTransaction(tx, salt);
  }

  // ── Upcoming Bills Prediction ───────────────────────────────────────────────
  async getUpcomingBills(userId: string, cashbookId: string) {
    // 1. Verify access
    const cashbook = await this.prisma.cashbook.findFirst({
      where: {
        id: cashbookId,
        deletedAt: null,
        OR: [
          { userId },
          { members: { some: { userId, status: 'accepted' } } }
        ]
      }
    });
    if (!cashbook) throw new NotFoundException('Cashbook not found or access denied');

    // 2. Fetch last 90 days of expenses
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const txs = await this.prisma.transaction.findMany({
      where: {
        cashbookId,
        deletedAt: null,
        type: 'EXPENSE',
        date: { gte: ninetyDaysAgo }
      },
      orderBy: { date: 'desc' }
    });

    const salt = await this.getSalt(cashbook.userId);
    const decrypted = await Promise.all(txs.map(tx => this.decryptTransaction(tx, salt)));

    // 3. Group by merchant
    const merchantGroups: Record<string, typeof decrypted> = {};
    for (const tx of decrypted) {
      if (!tx.merchant) continue;
      const m = tx.merchant.trim().toLowerCase();
      if (!merchantGroups[m]) merchantGroups[m] = [];
      merchantGroups[m].push(tx);
    }

    // 4. Predict bills
    const upcoming: any[] = [];
    const now = new Date();

    for (const [merchant, groupTxs] of Object.entries(merchantGroups)) {
      if (groupTxs.length < 2) continue; // Need at least 2 occurrences to establish a pattern

      // Check if amounts are exactly the same
      const firstAmount = parseFloat(groupTxs[0].amount.toString());
      const allSameAmount = groupTxs.every(tx => Math.abs(parseFloat(tx.amount.toString()) - firstAmount) < 0.01);
      
      if (allSameAmount || groupTxs[0].isRecurring) {
        // Calculate average gap in days
        let totalGap = 0;
        for (let i = 0; i < groupTxs.length - 1; i++) {
          const gap = (groupTxs[i].date.getTime() - groupTxs[i+1].date.getTime()) / (1000 * 60 * 60 * 24);
          totalGap += gap;
        }
        const avgGap = totalGap / (groupTxs.length - 1);

        // Assume it's a monthly (28-31 days) or weekly (7 days) bill
        if ((avgGap >= 25 && avgGap <= 35) || (avgGap >= 6 && avgGap <= 8) || groupTxs[0].isRecurring) {
          const lastTxDate = new Date(groupTxs[0].date);
          const nextDueDate = new Date(lastTxDate);
          nextDueDate.setDate(nextDueDate.getDate() + Math.round(avgGap));
          
          // Only show if it's due within the next 14 days or slightly overdue
          const daysUntilDue = (nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          
          if (daysUntilDue >= -5 && daysUntilDue <= 14) {
            upcoming.push({
              merchant: groupTxs[0].merchant,
              amount: firstAmount,
              currency: groupTxs[0].currency,
              nextDueDate,
              frequency: avgGap > 20 ? 'monthly' : 'weekly',
              lastPaidId: groupTxs[0].id
            });
          }
        }
      }
    }

    // 5. Fetch explicit manual recurring transactions from database
    const manualRecurring = await this.prisma.recurringTransaction.findMany({
      where: {
        cashbookId,
        isActive: true,
      }
    });

    for (const rec of manualRecurring) {
      const name = await this.crypto.decrypt(rec.name, salt);
      upcoming.push({
        id: rec.id,
        merchant: name,
        amount: parseFloat(rec.amount.toString()),
        currency: rec.currency,
        nextDueDate: rec.nextDueAt,
        frequency: rec.frequency,
        isManual: true
      });
    }

    return upcoming.sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime());
  }

  // ── Manual Subscriptions CRUD ───────────────────────────────────────────────
  
  async createRecurringTransaction(userId: string, cashbookId: string, dto: any) {
    const cashbook = await this.prisma.cashbook.findFirst({
      where: {
        id: cashbookId,
        deletedAt: null,
        OR: [
          { userId },
          { members: { some: { userId, status: 'accepted', role: { in: ['OWNER', 'EDITOR'] } } } }
        ]
      }
    });
    if (!cashbook) throw new ForbiddenException('Cannot edit this cashbook');

    const salt = await this.getSalt(cashbook.userId);
    const encName = await this.crypto.encrypt(dto.name, salt);

    // Calculate next due date
    const startDate = new Date(dto.startDate);
    const nextDueAt = new Date(startDate);
    if (nextDueAt < new Date()) {
      if (dto.frequency === 'monthly') nextDueAt.setMonth(nextDueAt.getMonth() + 1);
      else if (dto.frequency === 'weekly') nextDueAt.setDate(nextDueAt.getDate() + 7);
      else if (dto.frequency === 'yearly') nextDueAt.setFullYear(nextDueAt.getFullYear() + 1);
    }

    return this.prisma.recurringTransaction.create({
      data: {
        userId,
        cashbookId,
        name: encName,
        amount: dto.amount,
        currency: dto.currency || 'INR',
        type: 'EXPENSE',
        frequency: dto.frequency,
        startDate,
        nextDueAt,
        isActive: true
      }
    });
  }

  async updateRecurringTransaction(userId: string, id: string, dto: any) {
    const rec = await this.prisma.recurringTransaction.findUnique({ where: { id } });
    if (!rec) throw new NotFoundException('Subscription not found');

    const cashbook = await this.prisma.cashbook.findFirst({
      where: {
        id: rec.cashbookId,
        OR: [{ userId }, { members: { some: { userId, status: 'accepted', role: { in: ['OWNER', 'EDITOR'] } } } }]
      }
    });
    if (!cashbook) throw new ForbiddenException('Cannot edit this subscription');

    const salt = await this.getSalt(cashbook.userId);
    let encName = rec.name;
    if (dto.name) {
      encName = await this.crypto.encrypt(dto.name, salt);
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : rec.startDate;
    const frequency = dto.frequency || rec.frequency;
    
    let nextDueAt = rec.nextDueAt;
    if (dto.startDate || dto.frequency) {
      nextDueAt = new Date(startDate);
      if (nextDueAt < new Date()) {
        if (frequency === 'monthly') nextDueAt.setMonth(nextDueAt.getMonth() + 1);
        else if (frequency === 'weekly') nextDueAt.setDate(nextDueAt.getDate() + 7);
        else if (frequency === 'yearly') nextDueAt.setFullYear(nextDueAt.getFullYear() + 1);
      }
    }

    return this.prisma.recurringTransaction.update({
      where: { id },
      data: {
        name: encName,
        amount: dto.amount ?? rec.amount,
        frequency,
        startDate,
        nextDueAt,
      }
    });
  }

  async deleteRecurringTransaction(userId: string, id: string) {
    const rec = await this.prisma.recurringTransaction.findUnique({ where: { id } });
    if (!rec) throw new NotFoundException('Subscription not found');

    const cashbook = await this.prisma.cashbook.findFirst({
      where: {
        id: rec.cashbookId,
        OR: [{ userId }, { members: { some: { userId, status: 'accepted', role: { in: ['OWNER', 'EDITOR'] } } } }]
      }
    });
    if (!cashbook) throw new ForbiddenException('Cannot delete this subscription');

    return this.prisma.recurringTransaction.delete({ where: { id } });
  }

  // ── Create ──────────────────────────────────────────────────────────────────
  async create(userId: string, dto: CreateTransactionDto) {
    // Verify cashbook ownership or editor role
    const cashbook = await this.prisma.cashbook.findFirst({
      where: {
        id: dto.cashbookId, deletedAt: null,
        OR: [
          { userId },
          { members: { some: { userId, status: 'accepted', role: 'EDITOR' } } },
        ],
      },
    });
    if (!cashbook) throw new NotFoundException('Cashbook not found');

    const ownerId = cashbook.userId;
    const salt = await this.getSalt(ownerId);

    // Plan: check monthly transaction limit against owner
    const monthlyLimit = await this.features.getNumericLimit(ownerId, 'max_transactions_monthly');
    if (monthlyLimit !== Infinity) {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const count = await this.prisma.transaction.count({
        where: { userId: ownerId, createdAt: { gte: startOfMonth }, deletedAt: null },
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
      const suggested = await this.categorization.suggest(ownerId, dto.merchant, dto.notes);
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
        userId: ownerId, cashbookId: dto.cashbookId, categoryId,
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
      await this.categorization.learnMapping(ownerId, dto.merchant, categoryId);
    }

    return { ...this.decryptTransaction(tx, salt), autoDetectedCategory: autoDetected };
  }

  // ── Update ──────────────────────────────────────────────────────────────────
  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    const tx = await this.prisma.transaction.findFirst({
      where: {
        id, deletedAt: null,
        OR: [
          { userId },
          { cashbook: { members: { some: { userId, status: 'accepted', role: 'EDITOR' } } } },
        ],
      },
      include: { cashbook: true },
    });
    if (!tx) throw new NotFoundException('Transaction not found');
    const ownerId = tx.cashbook?.userId || tx.userId;
    const salt = await this.getSalt(ownerId);

    const encNotes = dto.notes !== undefined ? (dto.notes ? this.crypto.encrypt(dto.notes, salt) : null) : undefined;
    const encMerchant = dto.merchant !== undefined ? (dto.merchant ? this.crypto.encrypt(dto.merchant, salt) : null) : undefined;

    if (dto.merchant && dto.categoryId) {
      await this.categorization.learnMapping(ownerId, dto.merchant, dto.categoryId);
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
    const tx = await this.prisma.transaction.findFirst({
      where: {
        id, deletedAt: null,
        OR: [
          { userId },
          { cashbook: { members: { some: { userId, status: 'accepted', role: 'EDITOR' } } } },
        ],
      },
    });
    if (!tx) throw new NotFoundException('Transaction not found');
    await this.prisma.transaction.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Transaction deleted' };
  }

  // ── Bulk Delete ─────────────────────────────────────────────────────────────
  async bulkDelete(userId: string, ids: string[]) {
    const allowed = await this.prisma.transaction.findMany({
      where: {
        id: { in: ids }, deletedAt: null,
        OR: [
          { userId },
          { cashbook: { members: { some: { userId, status: 'accepted', role: 'EDITOR' } } } },
        ],
      },
      select: { id: true },
    });
    const validIds = allowed.map(a => a.id);
    if (validIds.length === 0) return { deleted: 0 };

    const result = await this.prisma.transaction.updateMany({
      where: { id: { in: validIds } },
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

  // ── OCR Scanner using Gemini 1.5 Flash ──────────────────────────────────────
  async scanReceiptMock(userId: string, imageBase64: string) {
    const featureEnabled = await this.prisma.appConfig.findUnique({ where: { key: 'feature_ocr_active' } });
    if (featureEnabled?.value !== 'true') {
      throw new ForbiddenException('Receipt scanning is currently disabled globally.');
    }

    const dbKey = await this.prisma.appConfig.findUnique({ where: { key: 'gemini_api_key' } });
    const apiKey = dbKey?.value || this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new ForbiddenException('Gemini API key is not configured.');
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
      const prompt = `
        Analyze this receipt and extract the following information in strict JSON format:
        {
          "amount": number (the total amount paid, extract just the number),
          "merchant": string (the name of the store or merchant),
          "date": string (ISO 8601 format date if visible, else null),
          "categorySuggestion": string (suggest a short category like "Food", "Electronics", "Travel", etc),
          "hasWarranty": boolean (true if warranty is mentioned),
          "warrantyUntil": string (ISO 8601 format date if a warranty duration is mentioned, calculated from receipt date, else null),
          "notes": string (brief summary of items purchased, max 50 chars)
        }
        Return ONLY valid JSON.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [
          prompt,
          {
            inlineData: {
              data: imageBase64,
              mimeType: 'image/jpeg', // Assumption, but works for most base64 uploads
            }
          }
        ],
        config: {
          responseMimeType: 'application/json',
        }
      });

      const text = response.text || '{}';
      const parsedData = JSON.parse(text);

      return {
        success: true,
        parsedData: {
          amount: parsedData.amount || 0,
          merchant: parsedData.merchant || 'Unknown Merchant',
          date: parsedData.date || new Date().toISOString(),
          categorySuggestion: parsedData.categorySuggestion || 'Other',
          hasWarranty: parsedData.hasWarranty || false,
          warrantyUntil: parsedData.warrantyUntil || null,
          notes: parsedData.notes || '',
        }
      };
    } catch (error) {
      console.error('Gemini OCR Error:', error);
      throw new ForbiddenException('Failed to process receipt with AI. Please try again.');
    }
  }
}
