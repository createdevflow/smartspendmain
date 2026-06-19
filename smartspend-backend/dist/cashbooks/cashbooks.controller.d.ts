import { CashbooksService } from './cashbooks.service';
import { CashbookMembersService } from './cashbooks.members.service';
import { CreateCashbookDto } from './dto/create-cashbook.dto';
import { UpdateCashbookDto } from './dto/update-cashbook.dto';
export declare class CashbooksController {
    private readonly cashbooksService;
    private readonly membersService;
    constructor(cashbooksService: CashbooksService, membersService: CashbookMembersService);
    findAll(user: any, archived?: string): Promise<{
        name: string;
        description: string | null;
        balance: string;
        income: string;
        expense: string;
        memberRole: string;
        isShared: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        userId: string;
        color: string;
        icon: string;
        currency: string;
        openingBalance: import("@prisma/client/runtime/library").Decimal;
        isArchived: boolean;
        isDefault: boolean;
        sortOrder: number;
    }[]>;
    create(user: any, dto: CreateCashbookDto): Promise<{
        name: string;
        description: string | undefined;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        userId: string;
        color: string;
        icon: string;
        currency: string;
        openingBalance: import("@prisma/client/runtime/library").Decimal;
        isArchived: boolean;
        isDefault: boolean;
        sortOrder: number;
    }>;
    findOne(user: any, id: string): Promise<{
        name: string;
        description: string | null;
        balance: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        userId: string;
        color: string;
        icon: string;
        currency: string;
        openingBalance: import("@prisma/client/runtime/library").Decimal;
        isArchived: boolean;
        isDefault: boolean;
        sortOrder: number;
    }>;
    update(user: any, id: string, dto: UpdateCashbookDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        userId: string;
        name: string;
        description: string | null;
        color: string;
        icon: string;
        currency: string;
        openingBalance: import("@prisma/client/runtime/library").Decimal;
        isArchived: boolean;
        isDefault: boolean;
        sortOrder: number;
    }>;
    remove(user: any, id: string): Promise<{
        message: string;
    }>;
    reorder(user: any, body: {
        orderedIds: string[];
    }): Promise<{
        message: string;
    }>;
    getMembers(user: any, id: string): Promise<{
        owner: {
            role: string;
            id?: string | undefined;
            email?: string | undefined;
            fullName?: string | undefined;
            avatar?: string | null | undefined;
        };
        members: ({
            user: {
                id: string;
                email: string;
                fullName: string;
                avatar: string | null;
            } | null;
        } & {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.CashbookMemberRole;
            status: string;
            userId: string | null;
            cashbookId: string;
            inviteToken: string | null;
            invitedAt: Date;
            acceptedAt: Date | null;
        })[];
    }>;
    inviteMember(user: any, id: string, body: {
        email: string;
        role: 'EDITOR' | 'VIEWER';
    }): Promise<{
        message: string;
        token: string;
    }>;
    createInviteLink(user: any, id: string): Promise<{
        token: string;
        link: string;
    }>;
    removeMember(user: any, id: string, memberId: string): Promise<{
        message: string;
    }>;
    updateMemberRole(user: any, id: string, memberId: string, body: {
        role: 'EDITOR' | 'VIEWER';
    }): Promise<{
        id: string;
        email: string;
        role: import(".prisma/client").$Enums.CashbookMemberRole;
        status: string;
        userId: string | null;
        cashbookId: string;
        inviteToken: string | null;
        invitedAt: Date;
        acceptedAt: Date | null;
    }>;
    leaveBook(user: any, id: string): Promise<{
        message: string;
    }>;
    acceptInvite(user: any, token: string): Promise<{
        message: string;
        cashbookId: string;
    }>;
}
