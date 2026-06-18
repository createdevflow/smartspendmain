import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(user: any): Promise<{
        type: import(".prisma/client").$Enums.NotificationType;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        createdAt: Date;
        userId: string;
        title: string;
        body: string;
        actionUrl: string | null;
        isRead: boolean;
        sentAt: Date | null;
    }[]>;
    markAsRead(user: any, id: string): Promise<{
        type: import(".prisma/client").$Enums.NotificationType;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        createdAt: Date;
        userId: string;
        title: string;
        body: string;
        actionUrl: string | null;
        isRead: boolean;
        sentAt: Date | null;
    }>;
    markAllAsRead(user: any): Promise<{
        message: string;
    }>;
    remove(user: any, id: string): Promise<{
        message: string;
    }>;
}
