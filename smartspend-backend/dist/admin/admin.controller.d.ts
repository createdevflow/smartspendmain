import { AdminService } from './admin.service';
import { MailService } from '../mail/mail.service';
export declare class AdminController {
    private readonly adminService;
    private readonly mailService;
    constructor(adminService: AdminService, mailService: MailService);
    getDashboard(): Promise<{
        metrics: {
            totalUsers: number;
            activeSessions: number;
            totalTransactions: number;
            activeSubscriptions: number;
            newUsersThisMonth: number;
            verifiedUsers: number;
            suspendedUsers: number;
            totalBudgets: number;
            totalGoals: number;
            totalDevices: number;
            recentFailedLogins: number;
        };
        monthlyTrend: {
            month: string;
            users: number;
        }[];
        recentEvents: ({
            user: {
                fullName: string;
                email: string;
            } | null;
        } & {
            action: import(".prisma/client").$Enums.AuditAction;
            id: string;
            userId: string | null;
            entity: string | null;
            entityId: string | null;
            ipAddress: string | null;
            userAgent: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
        })[];
    }>;
    getUsers(search?: string, status?: string, role?: string, page?: number, limit?: number): Promise<{
        data: {
            isEmailVerified: boolean;
            status: import(".prisma/client").$Enums.UserStatus;
            id: string;
            createdAt: Date;
            fullName: string;
            email: string;
            phone: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            lastLoginAt: Date | null;
            plan: {
                name: string;
                slug: string;
                color: string;
            } | null;
            _count: {
                cashbooks: number;
                transactions: number;
                devices: number;
            };
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getUserDetail(id: string): Promise<{
        isEmailVerified: boolean;
        status: import(".prisma/client").$Enums.UserStatus;
        id: string;
        createdAt: Date;
        fullName: string;
        email: string;
        phone: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        defaultCurrency: string;
        timezone: string;
        language: string;
        updatedAt: Date;
        lastLoginAt: Date | null;
        plan: {
            id: string;
            name: string;
            slug: string;
        } | null;
        cashbooks: {
            id: string;
            createdAt: Date;
            currency: string;
            isArchived: boolean;
        }[];
        devices: {
            id: string;
            createdAt: Date;
            deviceName: string | null;
            platform: string | null;
            lastSeenAt: Date;
        }[];
        sessions: {
            id: string;
            ipAddress: string | null;
            createdAt: Date;
            deviceName: string | null;
            platform: string | null;
        }[];
        _count: {
            cashbooks: number;
            transactions: number;
            budgets: number;
            goals: number;
            devices: number;
            sessions: number;
        };
    }>;
    updateUserStatus(id: string, body: {
        status: any;
    }): Promise<{
        deletedAt: Date | null;
        isEmailVerified: boolean;
        status: import(".prisma/client").$Enums.UserStatus;
        id: string;
        createdAt: Date;
        fullName: string;
        email: string;
        phone: string | null;
        avatar: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        planId: string | null;
        expoPushToken: string | null;
        defaultCurrency: string;
        timezone: string;
        language: string;
        pushNotifications: boolean;
        emailReports: boolean;
        updatedAt: Date;
        lastLoginAt: Date | null;
    }>;
    updateUserRole(id: string, body: {
        role: any;
    }): Promise<{
        deletedAt: Date | null;
        isEmailVerified: boolean;
        status: import(".prisma/client").$Enums.UserStatus;
        id: string;
        createdAt: Date;
        fullName: string;
        email: string;
        phone: string | null;
        avatar: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        planId: string | null;
        expoPushToken: string | null;
        defaultCurrency: string;
        timezone: string;
        language: string;
        pushNotifications: boolean;
        emailReports: boolean;
        updatedAt: Date;
        lastLoginAt: Date | null;
    }>;
    assignPlanToUser(id: string, body: {
        planId: string;
    }): Promise<{
        deletedAt: Date | null;
        isEmailVerified: boolean;
        status: import(".prisma/client").$Enums.UserStatus;
        id: string;
        createdAt: Date;
        fullName: string;
        email: string;
        phone: string | null;
        avatar: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        planId: string | null;
        expoPushToken: string | null;
        defaultCurrency: string;
        timezone: string;
        language: string;
        pushNotifications: boolean;
        emailReports: boolean;
        updatedAt: Date;
        lastLoginAt: Date | null;
    }>;
    deleteUser(id: string): Promise<{
        message: string;
    }>;
    hardDeleteUser(id: string): Promise<{
        message: string;
    }>;
    adminChangePassword(id: string, body: {
        password: string;
    }): Promise<{
        message: string;
    }>;
    impersonateUser(id: string): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            fullName: string;
        };
    }>;
    resetUserAccount(id: string): Promise<{
        message: string;
    }>;
    getTransactions(page?: number, limit?: number, userId?: string, type?: string, from?: string, to?: string, search?: string): Promise<{
        data: {
            encNotes: undefined;
            encMerchant: undefined;
            notes: string | null;
            merchant: string | null;
            user: {
                id: string;
                fullName: string;
                email: string;
            };
            cashbook: {
                id: string;
                currency: string;
            };
            category: {
                id: string;
                name: string;
                color: string;
                emoji: string;
            } | null;
            deletedAt: Date | null;
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            currency: string;
            cashbookId: string;
            categoryId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            exchangeRate: import("@prisma/client/runtime/library").Decimal | null;
            amountInBookCurrency: import("@prisma/client/runtime/library").Decimal | null;
            type: import(".prisma/client").$Enums.TransactionType;
            paymentMethod: string | null;
            date: Date;
            valueDate: Date | null;
            labels: import(".prisma/client").$Enums.TransactionLabel[];
            tags: string[];
            isGstApplied: boolean;
            gstRate: import("@prisma/client/runtime/library").Decimal | null;
            cgst: import("@prisma/client/runtime/library").Decimal | null;
            sgst: import("@prisma/client/runtime/library").Decimal | null;
            igst: import("@prisma/client/runtime/library").Decimal | null;
            receiptKey: string | null;
            receiptUrl: string | null;
            warrantyUntil: Date | null;
            isRecurring: boolean;
            recurringId: string | null;
            localId: string | null;
            syncedAt: Date | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getAuditLogs(page?: number, limit?: number, userId?: string, action?: string): Promise<{
        data: ({
            user: {
                id: string;
                fullName: string;
                email: string;
            } | null;
        } & {
            action: import(".prisma/client").$Enums.AuditAction;
            id: string;
            userId: string | null;
            entity: string | null;
            entityId: string | null;
            ipAddress: string | null;
            userAgent: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getPlans(): Promise<({
        _count: {
            users: number;
        };
        features: ({
            feature: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                sortOrder: number;
                type: string;
                category: string | null;
                key: string;
                defaultValue: string;
                unit: string | null;
                isVisible: boolean;
            };
        } & {
            id: string;
            planId: string;
            featureId: string;
            value: string;
        })[];
    } & {
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        description: string | null;
        tagline: string | null;
        color: string;
        isDefault: boolean;
        priceMonthly: number;
        priceYearly: number;
        sortOrder: number;
    })[]>;
    createPlan(dto: any): Promise<{
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        description: string | null;
        tagline: string | null;
        color: string;
        isDefault: boolean;
        priceMonthly: number;
        priceYearly: number;
        sortOrder: number;
    }>;
    updatePlan(id: string, dto: any): Promise<{
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        description: string | null;
        tagline: string | null;
        color: string;
        isDefault: boolean;
        priceMonthly: number;
        priceYearly: number;
        sortOrder: number;
    }>;
    deletePlan(id: string, fallbackPlanId?: string): Promise<{
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        description: string | null;
        tagline: string | null;
        color: string;
        isDefault: boolean;
        priceMonthly: number;
        priceYearly: number;
        sortOrder: number;
    }>;
    duplicatePlan(id: string): Promise<{
        _count: {
            users: number;
        };
        features: {
            id: string;
            planId: string;
            featureId: string;
            value: string;
        }[];
    } & {
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        description: string | null;
        tagline: string | null;
        color: string;
        isDefault: boolean;
        priceMonthly: number;
        priceYearly: number;
        sortOrder: number;
    }>;
    assignUsersToPlan(id: string, body: {
        emails: string[];
    }): Promise<{
        count: number;
        plan: {
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            slug: string;
            description: string | null;
            tagline: string | null;
            color: string;
            isDefault: boolean;
            priceMonthly: number;
            priceYearly: number;
            sortOrder: number;
        };
    }>;
    getFeatures(): Promise<({
        planFeatures: ({
            plan: {
                id: string;
                name: string;
                slug: string;
            };
        } & {
            id: string;
            planId: string;
            featureId: string;
            value: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        sortOrder: number;
        type: string;
        category: string | null;
        key: string;
        defaultValue: string;
        unit: string | null;
        isVisible: boolean;
    })[]>;
    reorderFeatures(body: {
        updates: {
            id: string;
            sortOrder: number;
        }[];
    }): Promise<{
        success: boolean;
    }>;
    createFeature(dto: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        sortOrder: number;
        type: string;
        category: string | null;
        key: string;
        defaultValue: string;
        unit: string | null;
        isVisible: boolean;
    }>;
    updateFeature(id: string, dto: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        sortOrder: number;
        type: string;
        category: string | null;
        key: string;
        defaultValue: string;
        unit: string | null;
        isVisible: boolean;
    }>;
    deleteFeature(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        sortOrder: number;
        type: string;
        category: string | null;
        key: string;
        defaultValue: string;
        unit: string | null;
        isVisible: boolean;
    }>;
    setPlanFeatureValue(planId: string, featureId: string, body: {
        value: string;
    }): Promise<{
        id: string;
        planId: string;
        featureId: string;
        value: string;
    }>;
    removePlanFeature(planId: string, featureId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getTickets(status?: string, page?: number, limit?: number): Promise<{
        data: ({
            user: {
                id: string;
                fullName: string;
                email: string;
            };
            replies: {
                createdAt: Date;
                message: string;
                isAdmin: boolean;
            }[];
        } & {
            status: string;
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            subject: string;
            message: string;
            priority: string;
            attachmentUrl: string | null;
            resolvedAt: Date | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    updateTicketStatus(id: string, body: {
        status: string;
    }): Promise<{
        status: string;
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        subject: string;
        message: string;
        priority: string;
        attachmentUrl: string | null;
        resolvedAt: Date | null;
    }>;
    replyTicket(user: any, id: string, body: {
        message: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        message: string;
        ticketId: string;
        authorId: string;
        isAdmin: boolean;
    }>;
    getSettings(): Promise<{
        id: string;
        updatedAt: Date;
        description: string | null;
        value: string;
        key: string;
        isPublic: boolean;
        updatedBy: string | null;
    }[]>;
    updateSettings(body: any): Promise<any[]>;
    getAppConfig(): Promise<Record<string, string>>;
    updateAppConfig(body: any): Promise<any[]>;
    getSharedCashbooks(page?: number, limit?: number): Promise<{
        data: ({
            user: {
                id: string;
                fullName: string;
                email: string;
            };
            _count: {
                members: number;
            };
            members: ({
                user: {
                    id: string;
                    fullName: string;
                    email: string;
                } | null;
            } & {
                status: string;
                id: string;
                userId: string | null;
                email: string;
                role: import(".prisma/client").$Enums.CashbookMemberRole;
                cashbookId: string;
                inviteToken: string | null;
                invitedAt: Date;
                acceptedAt: Date | null;
            })[];
        } & {
            deletedAt: Date | null;
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            color: string;
            isDefault: boolean;
            sortOrder: number;
            icon: string;
            currency: string;
            openingBalance: import("@prisma/client/runtime/library").Decimal;
            isArchived: boolean;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    removeCashbookMember(memberId: string): Promise<{
        message: string;
    }>;
    getTaxExportLogs(page?: number, limit?: number): Promise<{
        data: ({
            user: {
                id: string;
                fullName: string;
                email: string;
            };
        } & {
            id: string;
            userId: string;
            year: number;
            txCount: number;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            exportedAt: Date;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    sendTestEmail(user: any, body: any): Promise<{
        message: string;
    }>;
}
