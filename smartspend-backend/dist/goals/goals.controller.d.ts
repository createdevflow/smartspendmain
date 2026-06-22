import { GoalsService } from './goals.service';
export declare class GoalsController {
    private readonly goalsService;
    constructor(goalsService: GoalsService);
    findAll(u: any): Promise<{
        name: string;
        description: string | null;
        id: string;
        updatedAt: Date;
        createdAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.GoalStatus;
        currency: string;
        emoji: string | null;
        targetAmount: import("@prisma/client/runtime/library").Decimal;
        currentAmount: import("@prisma/client/runtime/library").Decimal;
        deadline: Date | null;
        linkedCashbookId: string | null;
    }[]>;
    create(u: any, dto: any): Promise<{
        name: string;
        id: string;
        description: string | null;
        updatedAt: Date;
        createdAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.GoalStatus;
        currency: string;
        emoji: string | null;
        targetAmount: import("@prisma/client/runtime/library").Decimal;
        currentAmount: import("@prisma/client/runtime/library").Decimal;
        deadline: Date | null;
        linkedCashbookId: string | null;
    }>;
    findOne(u: any, id: string): Promise<{
        name: string;
        description: string | null;
        contributions: {
            id: string;
            createdAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            goalId: string;
            note: string | null;
        }[];
        id: string;
        updatedAt: Date;
        createdAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.GoalStatus;
        currency: string;
        emoji: string | null;
        targetAmount: import("@prisma/client/runtime/library").Decimal;
        currentAmount: import("@prisma/client/runtime/library").Decimal;
        deadline: Date | null;
        linkedCashbookId: string | null;
    }>;
    update(u: any, id: string, dto: any): Promise<{
        name: string;
        id: string;
        description: string | null;
        updatedAt: Date;
        createdAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.GoalStatus;
        currency: string;
        emoji: string | null;
        targetAmount: import("@prisma/client/runtime/library").Decimal;
        currentAmount: import("@prisma/client/runtime/library").Decimal;
        deadline: Date | null;
        linkedCashbookId: string | null;
    }>;
    remove(u: any, id: string): Promise<{
        message: string;
    }>;
    contribute(u: any, id: string, dto: any): Promise<{
        id: string;
        createdAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        goalId: string;
        note: string | null;
    }>;
    history(u: any, id: string): Promise<{
        id: string;
        createdAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        goalId: string;
        note: string | null;
    }[]>;
}
