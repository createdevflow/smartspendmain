import { PrismaService } from '../prisma/prisma.service';
export declare class SupportService {
    private prisma;
    constructor(prisma: PrismaService);
    getTickets(userId: string): Promise<({
        replies: {
            message: string;
            id: string;
            createdAt: Date;
            authorId: string;
            isAdmin: boolean;
            ticketId: string;
        }[];
    } & {
        type: string;
        message: string;
        id: string;
        updatedAt: Date;
        subject: string;
        priority: string;
        createdAt: Date;
        userId: string;
        status: string;
        attachmentUrl: string | null;
        resolvedAt: Date | null;
    })[]>;
    createTicket(userId: string, dto: any): Promise<{
        type: string;
        message: string;
        id: string;
        updatedAt: Date;
        subject: string;
        priority: string;
        createdAt: Date;
        userId: string;
        status: string;
        attachmentUrl: string | null;
        resolvedAt: Date | null;
    }>;
    replyTicket(userId: string, ticketId: string, dto: any): Promise<{
        message: string;
        id: string;
        createdAt: Date;
        authorId: string;
        isAdmin: boolean;
        ticketId: string;
    }>;
}
