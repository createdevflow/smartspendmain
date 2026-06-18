import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    dashboard(user: any): Promise<{
        period: {
            from: Date;
            to: Date;
        };
        baseCurrency: string;
        summary: {
            income: number;
            expense: number;
            savings: number;
            savingsRate: number;
            expenseChange: number;
        };
        netWorth: {
            netWorth: number;
        };
        recentTransactions: ({
            cashbook: {
                name: string;
                id: string;
                createdAt: Date;
                userId: string;
                description: string | null;
                updatedAt: Date;
                deletedAt: Date | null;
                color: string;
                isDefault: boolean;
                sortOrder: number;
                isArchived: boolean;
                icon: string;
                currency: string;
                openingBalance: import("@prisma/client/runtime/library").Decimal;
            };
            category: {
                name: string;
                id: string;
                color: string;
                emoji: string;
            } | null;
        } & {
            date: Date;
            exchangeRate: import("@prisma/client/runtime/library").Decimal | null;
            type: import(".prisma/client").$Enums.TransactionType;
            id: string;
            createdAt: Date;
            userId: string;
            updatedAt: Date;
            deletedAt: Date | null;
            tags: string[];
            currency: string;
            cashbookId: string;
            amountInBookCurrency: import("@prisma/client/runtime/library").Decimal | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            gstRate: import("@prisma/client/runtime/library").Decimal | null;
            cgst: import("@prisma/client/runtime/library").Decimal | null;
            sgst: import("@prisma/client/runtime/library").Decimal | null;
            igst: import("@prisma/client/runtime/library").Decimal | null;
            categoryId: string | null;
            encNotes: string | null;
            encMerchant: string | null;
            paymentMethod: string | null;
            valueDate: Date | null;
            labels: import(".prisma/client").$Enums.TransactionLabel[];
            isGstApplied: boolean;
            receiptKey: string | null;
            receiptUrl: string | null;
            warrantyUntil: Date | null;
            isRecurring: boolean;
            localId: string | null;
            syncedAt: Date | null;
            recurringId: string | null;
        })[];
    }>;
    cashflow(user: any, period?: 'weekly' | 'monthly' | 'yearly', cashbookId?: string): Promise<{
        label: string;
        income: number;
        expense: number;
        from: Date;
        to: Date;
    }[]>;
    categories(user: any, from?: string, to?: string, type?: string): Promise<{
        data: {
            category: {
                name: string;
                id: string;
                color: string;
                emoji: string;
            } | {
                id: null;
                name: string;
                emoji: string;
                color: string;
            };
            amount: number;
            count: number;
            percentage: number;
        }[];
        total: number;
        type: string;
        from: Date;
        to: Date;
    }>;
    insights(user: any): Promise<string[]>;
    netWorth(user: any): Promise<{
        netWorth: number;
    }>;
    heatmap(user: any, year?: number): Promise<Record<string, number>>;
    burnRate(user: any): Promise<{
        streak: number;
        burnRateDaysLeft: number;
        avgDailySpend: number;
        netWorth: number;
    } | null>;
}
