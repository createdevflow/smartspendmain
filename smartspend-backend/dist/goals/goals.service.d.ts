import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
export declare class GoalsService {
    private prisma;
    private crypto;
    constructor(prisma: PrismaService, crypto: CryptoService);
    private getSalt;
    findAll(userId: string): Promise<{
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
    findOne(userId: string, id: string): Promise<{
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
    create(userId: string, dto: any): Promise<{
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
    update(userId: string, id: string, dto: any): Promise<{
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
    remove(userId: string, id: string): Promise<{
        message: string;
    }>;
    contribute(userId: string, goalId: string, dto: {
        amount: number;
        note?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        goalId: string;
        note: string | null;
    }>;
    getHistory(userId: string, goalId: string): Promise<{
        id: string;
        createdAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        goalId: string;
        note: string | null;
    }[]>;
}
