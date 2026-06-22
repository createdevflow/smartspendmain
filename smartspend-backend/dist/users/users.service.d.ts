import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    getProfile(userId: string): Promise<{
        plan: {
            name: string;
            id: string;
            slug: string;
            color: string;
        } | null;
        id: string;
        updatedAt: Date;
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
        lastLoginAt: Date | null;
        deletedAt: Date | null;
    }>;
    updateProfile(userId: string, dto: any): Promise<{
        id: string;
        updatedAt: Date;
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
        lastLoginAt: Date | null;
        deletedAt: Date | null;
    }>;
    changePassword(userId: string, dto: {
        currentPassword: string;
        newPassword: string;
    }): Promise<{
        message: string;
    }>;
    deleteAccount(userId: string): Promise<{
        message: string;
    }>;
    getSessions(userId: string): Promise<{
        id: string;
        ipAddress: string | null;
        createdAt: Date;
        deviceName: string | null;
        platform: string | null;
        expiresAt: Date;
    }[]>;
    revokeSession(userId: string, sessionId: string): Promise<{
        message: string;
    }>;
    revokeAllSessions(userId: string): Promise<{
        message: string;
    }>;
    uploadAvatar(userId: string, base64Image: string): Promise<{
        id: string;
        updatedAt: Date;
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
        lastLoginAt: Date | null;
        deletedAt: Date | null;
    }>;
    updatePushToken(userId: string, token: string): Promise<{
        message: string;
    }>;
    syncContacts(userId: string, phoneNumbers: string[]): Promise<{
        id: string;
        fullName: string;
        email: string;
        phone: string | null;
        avatar: string | null;
    }[]>;
}
