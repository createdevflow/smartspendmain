import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { FeaturesService } from '../plans/features.service';
import { AuditService } from '../audit/audit.service';
import { CreateCashbookDto } from './dto/create-cashbook.dto';
import { UpdateCashbookDto } from './dto/update-cashbook.dto';
import { AuditAction } from '@prisma/client';

@Injectable()
export class CashbooksService {
  constructor(
    private prisma: PrismaService,
    private crypto: CryptoService,
    private features: FeaturesService,
    private audit: AuditService,
  ) {}

  private async getSalt(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { encryptionKeySalt: true } });
    return user?.encryptionKeySalt || '';
  }

  async findAll(userId: string, archived = false) {
    const salt = await this.getSalt(userId);

    // Get books user owns
    const ownedBooks = await this.prisma.cashbook.findMany({
      where: { userId, isArchived: archived, deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    // Get books user is an accepted member of (shared with them)
    const memberEntries = await this.prisma.cashbookMember.findMany({
      where: { userId, status: 'accepted' },
    });
    const sharedCashbookIds = memberEntries.map(m => m.cashbookId);
    const sharedCashbooksRaw = sharedCashbookIds.length > 0
      ? await this.prisma.cashbook.findMany({
          where: { id: { in: sharedCashbookIds }, isArchived: archived, deletedAt: null },
        })
      : [];
    const memberRoleMap: Record<string, string> = {};
    memberEntries.forEach(m => { memberRoleMap[m.cashbookId] = m.role; });
    const sharedBooks = sharedCashbooksRaw.map(b => ({ ...b, memberRole: memberRoleMap[b.id] || 'VIEWER', isShared: true }));

    // Combine and format
    const allBooks = [
      ...ownedBooks.map(b => ({ ...b, memberRole: 'OWNER', isShared: false })),
      ...sharedBooks,
    ];

    // Get owner info for shared books (to show who shared it)
    return Promise.all(allBooks.map(async (book) => {
      // For shared books, use owner's salt for decryption
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

  async findOne(userId: string, id: string) {
    const book = await this.prisma.cashbook.findFirst({ where: { id, userId, deletedAt: null } });
    if (!book) throw new NotFoundException('Cashbook not found');
    const salt = await this.getSalt(userId);
    const { income, expense } = await this.getBalance(userId, id);
    return {
      ...book,
      name: this.crypto.decrypt(book.name, salt),
      description: book.description ? this.crypto.decrypt(book.description, salt) : null,
      balance: (Number(book.openingBalance) + income - expense).toFixed(2),
    };
  }

  async create(userId: string, dto: CreateCashbookDto) {
    const limit = await this.features.getNumericLimit(userId, 'max_cashbooks');
    if (limit !== Infinity) {
      const count = await this.prisma.cashbook.count({ where: { userId, isArchived: false, deletedAt: null } });
      if (count >= limit) {
        throw new ForbiddenException({
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
    await this.audit.log({ userId, action: AuditAction.CASHBOOK_CREATED, entityId: book.id });
    return { ...book, name: dto.name, description: dto.description };
  }

  async update(userId: string, id: string, dto: UpdateCashbookDto) {
    const book = await this.prisma.cashbook.findFirst({ where: { id, userId, deletedAt: null } });
    if (!book) throw new NotFoundException('Cashbook not found');
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

  async remove(userId: string, id: string) {
    const book = await this.prisma.cashbook.findFirst({ where: { id, userId, deletedAt: null } });
    if (!book) throw new NotFoundException('Cashbook not found');
    if (book.isDefault) throw new ForbiddenException('Cannot delete the default cashbook');
    await this.prisma.cashbook.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.log({ userId, action: AuditAction.CASHBOOK_DELETED, entityId: id });
    return { message: 'Cashbook deleted' };
  }

  async reorder(userId: string, orderedIds: string[]) {
    await Promise.all(orderedIds.map((id, index) =>
      this.prisma.cashbook.updateMany({ where: { id, userId }, data: { sortOrder: index } })
    ));
    return { message: 'Order updated' };
  }

  private async getBalance(userId: string, cashbookId: string) {
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
}
