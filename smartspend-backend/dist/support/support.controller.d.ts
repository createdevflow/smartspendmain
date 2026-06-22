import { SupportService } from './support.service';
export declare class SupportController {
    private readonly supportService;
    constructor(supportService: SupportService);
    getTickets(user: any): Promise<({
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
    createTicket(user: any, dto: any): Promise<{
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
    replyTicket(user: any, id: string, dto: any): Promise<{
        message: string;
        id: string;
        createdAt: Date;
        authorId: string;
        isAdmin: boolean;
        ticketId: string;
    }>;
}
