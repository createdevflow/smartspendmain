import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
export declare class CashbookMembersService {
    private prisma;
    private mail;
    constructor(prisma: PrismaService, mail: MailService);
    private assertOwner;
    private assertFeatureEnabled;
    getMembers(userId: string, cashbookId: string): Promise<{
        owner: {
            role: string;
            id?: string | undefined;
            fullName?: string | undefined;
            email?: string | undefined;
            avatar?: string | null | undefined;
        };
        members: ({
            user: {
                id: string;
                fullName: string;
                email: string;
                avatar: string | null;
            } | null;
        } & {
            id: string;
            userId: string | null;
            email: string;
            role: import(".prisma/client").$Enums.CashbookMemberRole;
            status: string;
            cashbookId: string;
            inviteToken: string | null;
            invitedAt: Date;
            acceptedAt: Date | null;
        })[];
    }>;
    inviteMember(userId: string, cashbookId: string, dto: {
        email: string;
        role: 'EDITOR' | 'VIEWER';
    }): Promise<{
        message: string;
        token: string;
    }>;
    createInviteLink(userId: string, cashbookId: string): Promise<{
        token: string;
        link: string;
    }>;
    acceptInvite(userId: string, token: string): Promise<{
        message: string;
        cashbookId: string;
    }>;
    removeMember(userId: string, cashbookId: string, memberId: string): Promise<{
        message: string;
    }>;
    updateMemberRole(userId: string, cashbookId: string, memberId: string, role: 'EDITOR' | 'VIEWER'): Promise<{
        id: string;
        userId: string | null;
        email: string;
        role: import(".prisma/client").$Enums.CashbookMemberRole;
        status: string;
        cashbookId: string;
        inviteToken: string | null;
        invitedAt: Date;
        acceptedAt: Date | null;
    }>;
    leaveBook(userId: string, cashbookId: string): Promise<{
        message: string;
    }>;
    private sendInviteEmail;
}
