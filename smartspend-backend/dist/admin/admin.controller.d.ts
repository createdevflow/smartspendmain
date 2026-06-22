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
            id: string;
            action: import(".prisma/client").$Enums.AuditAction;
            entity: string | null;
            entityId: string | null;
            ipAddress: string | null;
            userAgent: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            userId: string | null;
        })[];
    }>;
    getUsers(search?: string, status?: string, role?: string, page?: number, limit?: number): Promise<{
        data: {
            plan: {
                name: string;
                slug: string;
                color: string;
            } | null;
            id: string;
            createdAt: Date;
            fullName: string;
            email: string;
            phone: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            status: import(".prisma/client").$Enums.UserStatus;
            isEmailVerified: boolean;
            lastLoginAt: Date | null;
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
        plan: {
            name: string;
            id: string;
            slug: string;
        } | null;
        id: string;
        updatedAt: Date;
        createdAt: Date;
        fullName: string;
        email: string;
        phone: string | null;
        defaultCurrency: string;
        role: import(".prisma/client").$Enums.UserRole;
        status: import(".prisma/client").$Enums.UserStatus;
        isEmailVerified: boolean;
        timezone: string;
        language: string;
        lastLoginAt: Date | null;
        cashbooks: {
            id: string;
            createdAt: Date;
            isArchived: boolean;
            currency: string;
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
    updateUserRole(id: string, body: {
        role: any;
    }): Promise<{
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
    assignPlanToUser(id: string, body: {
        planId: string;
    }): Promise<{
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
                name: string;
                id: string;
                color: string;
                emoji: string;
            } | null;
            date: Date;
            exchangeRate: import("@prisma/client/runtime/library").Decimal | null;
            type: import(".prisma/client").$Enums.TransactionType;
            id: string;
            updatedAt: Date;
            createdAt: Date;
            userId: string;
            deletedAt: Date | null;
            tags: string[];
            currency: string;
            cashbookId: string;
            amountInBookCurrency: import("@prisma/client/runtime/library").Decimal | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            gstRate: import("@prisma/client/runtime/library").Decimal | null;
            cgst: import("@prisma/client/runtime/library").Decimal | null;
            sgst: import("@prisma/client/runtime/library").Decimal | null;
            igst: import("@prisma/client/runtime/library").Decimal | null;
            categoryId: string | null;
            paymentMethod: string | null;
            valueDate: Date | null;
            labels: import(".prisma/client").$Enums.TransactionLabel[];
            isGstApplied: boolean;
            receiptKey: string | null;
            receiptUrl: string | null;
            warrantyUntil: Date | null;
            isRecurring: boolean;
            localId: string | null;
            syncedAt: Date | null;
            recurringId: string | null;
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
            id: string;
            action: import(".prisma/client").$Enums.AuditAction;
            entity: string | null;
            entityId: string | null;
            ipAddress: string | null;
            userAgent: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            userId: string | null;
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
                category: string | null;
                type: string;
                name: string;
                id: string;
                key: string;
                description: string | null;
                updatedAt: Date;
                createdAt: Date;
                sortOrder: number;
                defaultValue: string;
                unit: string | null;
                isVisible: boolean;
            };
        } & {
            id: string;
            value: string;
            planId: string;
            featureId: string;
        })[];
    } & {
        name: string;
        id: string;
        description: string | null;
        updatedAt: Date;
        createdAt: Date;
        slug: string;
        tagline: string | null;
        color: string;
        isActive: boolean;
        isDefault: boolean;
        priceMonthly: number;
        priceYearly: number;
        sortOrder: number;
    })[]>;
    createPlan(dto: any): Promise<{
        name: string;
        id: string;
        description: string | null;
        updatedAt: Date;
        createdAt: Date;
        slug: string;
        tagline: string | null;
        color: string;
        isActive: boolean;
        isDefault: boolean;
        priceMonthly: number;
        priceYearly: number;
        sortOrder: number;
    }>;
    updatePlan(id: string, dto: any): Promise<{
        name: string;
        id: string;
        description: string | null;
        updatedAt: Date;
        createdAt: Date;
        slug: string;
        tagline: string | null;
        color: string;
        isActive: boolean;
        isDefault: boolean;
        priceMonthly: number;
        priceYearly: number;
        sortOrder: number;
    }>;
    deletePlan(id: string, fallbackPlanId?: string): Promise<{
        name: string;
        id: string;
        description: string | null;
        updatedAt: Date;
        createdAt: Date;
        slug: string;
        tagline: string | null;
        color: string;
        isActive: boolean;
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
            value: string;
            planId: string;
            featureId: string;
        }[];
    } & {
        name: string;
        id: string;
        description: string | null;
        updatedAt: Date;
        createdAt: Date;
        slug: string;
        tagline: string | null;
        color: string;
        isActive: boolean;
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
            name: string;
            id: string;
            description: string | null;
            updatedAt: Date;
            createdAt: Date;
            slug: string;
            tagline: string | null;
            color: string;
            isActive: boolean;
            isDefault: boolean;
            priceMonthly: number;
            priceYearly: number;
            sortOrder: number;
        };
    }>;
    getFeatures(): Promise<({
        planFeatures: ({
            plan: {
                name: string;
                id: string;
                slug: string;
            };
        } & {
            id: string;
            value: string;
            planId: string;
            featureId: string;
        })[];
    } & {
        category: string | null;
        type: string;
        name: string;
        id: string;
        key: string;
        description: string | null;
        updatedAt: Date;
        createdAt: Date;
        sortOrder: number;
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
        category: string | null;
        type: string;
        name: string;
        id: string;
        key: string;
        description: string | null;
        updatedAt: Date;
        createdAt: Date;
        sortOrder: number;
        defaultValue: string;
        unit: string | null;
        isVisible: boolean;
    }>;
    updateFeature(id: string, dto: any): Promise<{
        category: string | null;
        type: string;
        name: string;
        id: string;
        key: string;
        description: string | null;
        updatedAt: Date;
        createdAt: Date;
        sortOrder: number;
        defaultValue: string;
        unit: string | null;
        isVisible: boolean;
    }>;
    deleteFeature(id: string): Promise<{
        category: string | null;
        type: string;
        name: string;
        id: string;
        key: string;
        description: string | null;
        updatedAt: Date;
        createdAt: Date;
        sortOrder: number;
        defaultValue: string;
        unit: string | null;
        isVisible: boolean;
    }>;
    setPlanFeatureValue(planId: string, featureId: string, body: {
        value: string;
    }): Promise<{
        id: string;
        value: string;
        planId: string;
        featureId: string;
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
                message: string;
                createdAt: Date;
                isAdmin: boolean;
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
    replyTicket(user: any, id: string, body: {
        message: string;
    }): Promise<{
        message: string;
        id: string;
        createdAt: Date;
        authorId: string;
        isAdmin: boolean;
        ticketId: string;
    }>;
    getSettings(): Promise<{
        id: string;
        key: string;
        value: string;
        description: string | null;
        isPublic: boolean;
        updatedAt: Date;
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
        } & {
            name: string;
            id: string;
            description: string | null;
            updatedAt: Date;
            createdAt: Date;
            userId: string;
            deletedAt: Date | null;
            color: string;
            isDefault: boolean;
            sortOrder: number;
            isArchived: boolean;
            icon: string;
            currency: string;
            openingBalance: import("@prisma/client/runtime/library").Decimal;
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
