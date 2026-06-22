import { PrismaService } from '../prisma/prisma.service';
export declare class NotificationsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string): Promise<{
        type: import(".prisma/client").$Enums.NotificationType;
        id: string;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        userId: string;
        title: string;
        body: string;
        actionUrl: string | null;
        isRead: boolean;
        sentAt: Date | null;
    }[]>;
    markAsRead(userId: string, id: string): Promise<{
        type: import(".prisma/client").$Enums.NotificationType;
        id: string;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        userId: string;
        title: string;
        body: string;
        actionUrl: string | null;
        isRead: boolean;
        sentAt: Date | null;
    }>;
    markAllAsRead(userId: string): Promise<{
        message: string;
    }>;
    remove(userId: string, id: string): Promise<{
        message: string;
    }>;
    create(userId: string, title: string, body: string, type: any): Promise<{
        type: import(".prisma/client").$Enums.NotificationType;
        id: string;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        userId: string;
        title: string;
        body: string;
        actionUrl: string | null;
        isRead: boolean;
        sentAt: Date | null;
    }>;
}
