import { TransactionType, TransactionLabel } from '@prisma/client';
export declare class CreateTransactionDto {
    cashbookId: string;
    amount: number;
    currency: string;
    type: TransactionType;
    date: string;
    categoryId?: string;
    merchant?: string;
    notes?: string;
    paymentMethod?: string;
    labels?: TransactionLabel[];
    tags?: string[];
    isGstApplied?: boolean;
    gstRate?: number;
    cgst?: number;
    sgst?: number;
    igst?: number;
    isRecurring?: boolean;
    recurringId?: string;
    receiptKey?: string;
    localId?: string;
}
