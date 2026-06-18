import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    profile(user: any): Promise<{
        plan: {
            name: string;
            id: string;
            slug: string;
            color: string;
        } | null;
        id: string;
        createdAt: Date;
        fullName: string;
        email: string;
        phone: string | null;
        defaultCurrency: string;
        avatar: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        status: import(".prisma/client").$Enums.UserStatus;
        planId: string | null;
        isEmailVerified: boolean;
        expoPushToken: string | null;
        timezone: string;
        language: string;
        pushNotifications: boolean;
        emailReports: boolean;
        updatedAt: Date;
        lastLoginAt: Date | null;
        deletedAt: Date | null;
    }>;
    updateProfile(user: any, dto: any): Promise<{
        id: string;
        createdAt: Date;
        fullName: string;
        email: string;
        phone: string | null;
        defaultCurrency: string;
        avatar: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        status: import(".prisma/client").$Enums.UserStatus;
        planId: string | null;
        isEmailVerified: boolean;
        expoPushToken: string | null;
        timezone: string;
        language: string;
        pushNotifications: boolean;
        emailReports: boolean;
        updatedAt: Date;
        lastLoginAt: Date | null;
        deletedAt: Date | null;
    }>;
    changePassword(user: any, dto: any): Promise<{
        message: string;
    }>;
    deleteAccount(user: any): Promise<{
        message: string;
    }>;
    sessions(user: any): Promise<{
        id: string;
        ipAddress: string | null;
        createdAt: Date;
        deviceName: string | null;
        platform: string | null;
        expiresAt: Date;
    }[]>;
    revokeSession(user: any, id: string): Promise<{
        message: string;
    }>;
    revokeAllSessions(user: any): Promise<{
        message: string;
    }>;
    updatePushToken(user: any, body: {
        token: string;
    }): Promise<{
        message: string;
    }>;
    uploadAvatar(user: any, body: {
        image: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        fullName: string;
        email: string;
        phone: string | null;
        defaultCurrency: string;
        avatar: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        status: import(".prisma/client").$Enums.UserStatus;
        planId: string | null;
        isEmailVerified: boolean;
        expoPushToken: string | null;
        timezone: string;
        language: string;
        pushNotifications: boolean;
        emailReports: boolean;
        updatedAt: Date;
        lastLoginAt: Date | null;
        deletedAt: Date | null;
    }>;
    syncContacts(user: any, body: {
        phoneNumbers: string[];
    }): Promise<{
        id: string;
        fullName: string;
        email: string;
        phone: string | null;
        avatar: string | null;
    }[]>;
}
