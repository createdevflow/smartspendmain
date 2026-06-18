import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { CurrencyService } from '../currency/currency.service';
import { CategorizationService } from '../categories/categorization.service';
import { FeaturesService } from '../plans/features.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionQueryDto } from './dto/transaction-query.dto';
export declare class TransactionsService {
    private prisma;
    private crypto;
    private currency;
    private categorization;
    private features;
    constructor(prisma: PrismaService, crypto: CryptoService, currency: CurrencyService, categorization: CategorizationService, features: FeaturesService);
    private getSalt;
    findAll(userId: string, query: TransactionQueryDto): Promise<{
        data: any[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(userId: string, id: string): Promise<any>;
    create(userId: string, dto: CreateTransactionDto): Promise<any>;
    update(userId: string, id: string, dto: UpdateTransactionDto): Promise<any>;
    remove(userId: string, id: string): Promise<{
        message: string;
    }>;
    bulkDelete(userId: string, ids: string[]): Promise<{
        deleted: number;
    }>;
    bulkImport(userId: string, transactions: CreateTransactionDto[]): Promise<{
        created: number;
        skipped: number;
        errors: string[];
    }>;
    search(userId: string, q: string): Promise<any[]>;
    private decryptTransaction;
    scanReceiptMock(userId: string, imageBase64: string): Promise<{
        success: boolean;
        parsedData: {
            amount: number;
            merchant: string;
            date: string;
            categorySuggestion: string;
            hasWarranty: boolean;
            warrantyUntil: string;
            notes: string;
        };
    }>;
}
