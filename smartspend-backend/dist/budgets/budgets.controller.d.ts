import { BudgetsService } from './budgets.service';
export declare class BudgetsController {
    private readonly budgetsService;
    constructor(budgetsService: BudgetsService);
    findAll(user: any): Promise<({
        category: {
            name: string;
            id: string;
            color: string;
            emoji: string;
        } | null;
    } & {
        name: string;
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        isActive: boolean;
        currency: string;
        cashbookId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        categoryId: string | null;
        period: import(".prisma/client").$Enums.BudgetPeriod;
        startDate: Date;
        endDate: Date | null;
        rollover: boolean;
        alertAt50: boolean;
        alertAt80: boolean;
        alertAt100: boolean;
    })[]>;
    create(user: any, dto: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        isActive: boolean;
        currency: string;
        cashbookId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        categoryId: string | null;
        period: import(".prisma/client").$Enums.BudgetPeriod;
        startDate: Date;
        endDate: Date | null;
        rollover: boolean;
        alertAt50: boolean;
        alertAt80: boolean;
        alertAt100: boolean;
    }>;
    findOne(user: any, id: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        isActive: boolean;
        currency: string;
        cashbookId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        categoryId: string | null;
        period: import(".prisma/client").$Enums.BudgetPeriod;
        startDate: Date;
        endDate: Date | null;
        rollover: boolean;
        alertAt50: boolean;
        alertAt80: boolean;
        alertAt100: boolean;
    }>;
    progress(user: any, id: string): Promise<{
        budget: {
            name: string;
            id: string;
            createdAt: Date;
            userId: string;
            updatedAt: Date;
            isActive: boolean;
            currency: string;
            cashbookId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            categoryId: string | null;
            period: import(".prisma/client").$Enums.BudgetPeriod;
            startDate: Date;
            endDate: Date | null;
            rollover: boolean;
            alertAt50: boolean;
            alertAt80: boolean;
            alertAt100: boolean;
        };
        spent: number;
        remaining: number;
        percentage: number;
        isOver: boolean;
    }>;
    update(user: any, id: string, dto: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        isActive: boolean;
        currency: string;
        cashbookId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        categoryId: string | null;
        period: import(".prisma/client").$Enums.BudgetPeriod;
        startDate: Date;
        endDate: Date | null;
        rollover: boolean;
        alertAt50: boolean;
        alertAt80: boolean;
        alertAt100: boolean;
    }>;
    remove(user: any, id: string): Promise<{
        message: string;
    }>;
}
