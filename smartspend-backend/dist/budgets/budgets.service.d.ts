import { PrismaService } from '../prisma/prisma.service';
export declare class BudgetsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string): Promise<({
        category: {
            name: string;
            id: string;
            color: string;
            emoji: string;
        } | null;
    } & {
        name: string;
        id: string;
        updatedAt: Date;
        createdAt: Date;
        userId: string;
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
    create(userId: string, dto: any): Promise<{
        name: string;
        id: string;
        updatedAt: Date;
        createdAt: Date;
        userId: string;
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
    findOne(userId: string, id: string): Promise<{
        name: string;
        id: string;
        updatedAt: Date;
        createdAt: Date;
        userId: string;
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
    getProgress(userId: string, id: string): Promise<{
        budget: {
            name: string;
            id: string;
            updatedAt: Date;
            createdAt: Date;
            userId: string;
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
    update(userId: string, id: string, dto: any): Promise<{
        name: string;
        id: string;
        updatedAt: Date;
        createdAt: Date;
        userId: string;
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
    remove(userId: string, id: string): Promise<{
        message: string;
    }>;
}
