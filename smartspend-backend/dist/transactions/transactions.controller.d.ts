import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { BulkImportDto } from './dto/bulk-import.dto';
export declare class TransactionsController {
    private readonly transactionsService;
    constructor(transactionsService: TransactionsService);
    findAll(user: any, query: TransactionQueryDto): Promise<{
        data: any[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    create(user: any, dto: CreateTransactionDto): Promise<any>;
    search(user: any, q: string): Promise<any[]>;
    import(user: any, dto: BulkImportDto): Promise<{
        created: number;
        skipped: number;
        errors: string[];
    }>;
    bulkDelete(user: any, body: {
        ids: string[];
    }): Promise<{
        deleted: number;
    }>;
    findOne(user: any, id: string): Promise<any>;
    update(user: any, id: string, dto: UpdateTransactionDto): Promise<any>;
    remove(user: any, id: string): Promise<{
        message: string;
    }>;
    scanReceipt(user: any, body: {
        imageBase64: string;
    }): Promise<{
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
