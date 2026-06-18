import { TransactionType, TransactionLabel } from '@prisma/client';
export declare class UpdateTransactionDto {
    amount?: number;
    currency?: string;
    type?: TransactionType;
    categoryId?: string;
    merchant?: string;
    notes?: string;
    paymentMethod?: string;
    date?: string;
    labels?: TransactionLabel[];
    tags?: string[];
    isGstApplied?: boolean;
    gstRate?: number;
}
