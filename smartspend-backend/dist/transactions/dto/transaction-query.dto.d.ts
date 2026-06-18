import { TransactionType, TransactionLabel } from '@prisma/client';
export declare class TransactionQueryDto {
    cashbookId?: string;
    type?: TransactionType;
    categoryId?: string;
    from?: string;
    to?: string;
    q?: string;
    paymentMethod?: string;
    labels?: TransactionLabel[];
    minAmount?: number;
    maxAmount?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
}
