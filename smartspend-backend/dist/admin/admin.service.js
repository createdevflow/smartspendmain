"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = exports.APP_FEATURE_KEYS = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
exports.APP_FEATURE_KEYS = [
    'feature_transactions',
    'feature_cashbooks',
    'feature_categories',
    'feature_analytics',
    'feature_reports',
    'feature_notifications',
    'feature_budget_management',
    'feature_savings_goals',
    'feature_multi_device_sync',
    'feature_backup_restore',
    'feature_export',
    'feature_import',
    'feature_user_registration',
    'feature_profile_editing',
    'feature_account_deletion',
    'maintenance_mode',
    'feature_app_updates',
    'feature_beta',
    'feature_whatsapp_active',
    'feature_ocr_active',
    'feature_gamification_active',
    'feature_shared_cashbooks_active',
    'feature_tax_export_active',
    'feature_panic_button_active',
];
let AdminService = class AdminService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboard() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const [totalUsers, activeUsers, totalTx, totalBooks, newUsersThisMonth, verifiedUsers, suspendedUsers, totalBudgets, totalGoals, totalDevices, recentFailedLogins,] = await Promise.all([
            this.prisma.user.count({ where: { deletedAt: null } }),
            this.prisma.session.count({ where: { isValid: true, expiresAt: { gt: new Date() } } }),
            this.prisma.transaction.count({ where: { deletedAt: null } }),
            this.prisma.cashbook.count({ where: { deletedAt: null } }),
            this.prisma.user.count({
                where: { deletedAt: null, createdAt: { gte: startOfMonth } },
            }),
            this.prisma.user.count({ where: { deletedAt: null, isEmailVerified: true } }),
            this.prisma.user.count({ where: { deletedAt: null, status: 'SUSPENDED' } }),
            this.prisma.budget.count({ where: { isActive: true } }),
            this.prisma.goal.count({ where: { status: 'ACTIVE' } }),
            this.prisma.device.count(),
            this.prisma.auditLog.count({ where: { action: client_1.AuditAction.LOGIN_FAILED, createdAt: { gte: startOfMonth } } }),
        ]);
        const monthlyTrend = [];
        for (let i = 5; i >= 0; i--) {
            const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
            const count = await this.prisma.user.count({
                where: { deletedAt: null, createdAt: { gte: start, lt: end } },
            });
            monthlyTrend.push({
                month: start.toLocaleString('default', { month: 'short' }),
                users: count,
            });
        }
        const recentEvents = await this.prisma.auditLog.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { email: true, fullName: true } } },
        });
        return {
            metrics: {
                totalUsers,
                activeSessions: activeUsers,
                totalTransactions: totalTx,
                activeSubscriptions: totalBooks,
                newUsersThisMonth,
                verifiedUsers,
                suspendedUsers,
                totalBudgets,
                totalGoals,
                totalDevices,
                recentFailedLogins,
            },
            monthlyTrend,
            recentEvents,
        };
    }
    async getUsers(search, status, role, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const where = { deletedAt: null };
        if (status)
            where.status = status;
        if (role)
            where.role = role;
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { fullName: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: {
                    id: true, email: true, fullName: true, phone: true,
                    status: true, role: true, isEmailVerified: true,
                    plan: { select: { name: true, slug: true, color: true } },
                    createdAt: true, lastLoginAt: true,
                    _count: { select: { cashbooks: true, transactions: true, devices: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.user.count({ where }),
        ]);
        return {
            data: users,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async getUserDetail(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true, email: true, fullName: true, phone: true,
                status: true, role: true, isEmailVerified: true,
                plan: { select: { id: true, name: true, slug: true } },
                defaultCurrency: true, timezone: true, language: true,
                createdAt: true, lastLoginAt: true, updatedAt: true,
                _count: { select: { cashbooks: true, transactions: true, goals: true, budgets: true, devices: true, sessions: true } },
                cashbooks: {
                    where: { deletedAt: null },
                    select: { id: true, currency: true, isArchived: true, createdAt: true },
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                },
                devices: {
                    select: { id: true, deviceName: true, platform: true, lastSeenAt: true, createdAt: true },
                    take: 5,
                    orderBy: { lastSeenAt: 'desc' },
                },
                sessions: {
                    where: { isValid: true, expiresAt: { gt: new Date() } },
                    select: { id: true, deviceName: true, platform: true, ipAddress: true, createdAt: true },
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async updateUserStatus(id, status) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const updated = await this.prisma.user.update({ where: { id }, data: { status } });
        const { passwordHash, encryptionKeySalt, ...safe } = updated;
        return safe;
    }
    async updateUserRole(id, role) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const updated = await this.prisma.user.update({ where: { id }, data: { role } });
        const { passwordHash, encryptionKeySalt, ...safe } = updated;
        return safe;
    }
    async assignPlanToUser(userId, planId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
        if (!plan)
            throw new common_1.NotFoundException('Plan not found');
        const updated = await this.prisma.user.update({ where: { id: userId }, data: { planId } });
        const { passwordHash, encryptionKeySalt, ...safe } = updated;
        return safe;
    }
    async deleteUser(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        await this.prisma.user.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                status: 'BANNED',
                email: `deleted_${Date.now()}_${user.email}`,
            },
        });
        await this.prisma.session.updateMany({
            where: { userId: id },
            data: { isValid: false },
        });
        return { message: 'User account deleted successfully' };
    }
    async resetUserAccount(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        await this.prisma.$transaction([
            this.prisma.transaction.updateMany({ where: { userId: id }, data: { deletedAt: new Date() } }),
            this.prisma.budget.updateMany({ where: { userId: id }, data: { isActive: false } }),
            this.prisma.goal.updateMany({ where: { userId: id }, data: { status: 'CANCELLED' } }),
            this.prisma.cashbook.updateMany({ where: { userId: id }, data: { deletedAt: new Date() } }),
            this.prisma.session.updateMany({ where: { userId: id }, data: { isValid: false } }),
        ]);
        return { message: 'User account data has been reset' };
    }
    async getPlans() {
        return this.prisma.plan.findMany({
            orderBy: { sortOrder: 'asc' },
            include: {
                features: {
                    include: { feature: true },
                    orderBy: { feature: { sortOrder: 'asc' } },
                },
                _count: { select: { users: true } },
            },
        });
    }
    async createPlan(dto) {
        const existing = await this.prisma.plan.findUnique({ where: { slug: dto.slug } });
        if (existing)
            throw new common_1.ConflictException(`Plan with slug "${dto.slug}" already exists`);
        return this.prisma.plan.create({ data: dto });
    }
    async updatePlan(id, dto) {
        const plan = await this.prisma.plan.findUnique({ where: { id } });
        if (!plan)
            throw new common_1.NotFoundException('Plan not found');
        return this.prisma.plan.update({ where: { id }, data: dto });
    }
    async deletePlan(id, fallbackPlanId) {
        const plan = await this.prisma.plan.findUnique({
            where: { id },
            include: { _count: { select: { users: true } } },
        });
        if (!plan)
            throw new common_1.NotFoundException('Plan not found');
        if (plan._count.users > 0) {
            if (!fallbackPlanId) {
                throw new common_1.BadRequestException('Plan has active users. Please provide a fallback plan ID to migrate users.');
            }
            const fallbackPlan = await this.prisma.plan.findUnique({ where: { id: fallbackPlanId } });
            if (!fallbackPlan)
                throw new common_1.NotFoundException('Fallback plan not found');
            await this.prisma.user.updateMany({
                where: { planId: id },
                data: { planId: fallbackPlanId },
            });
        }
        return this.prisma.plan.delete({ where: { id } });
    }
    async duplicatePlan(id) {
        const plan = await this.prisma.plan.findUnique({
            where: { id },
            include: { features: true },
        });
        if (!plan)
            throw new common_1.NotFoundException('Plan not found');
        const newSlug = `${plan.slug}-copy-${Date.now()}`;
        return this.prisma.plan.create({
            data: {
                name: `${plan.name} (Copy)`,
                slug: newSlug,
                description: plan.description,
                tagline: plan.tagline,
                color: plan.color,
                isActive: false,
                isDefault: false,
                priceMonthly: plan.priceMonthly,
                priceYearly: plan.priceYearly,
                sortOrder: plan.sortOrder + 1,
                features: {
                    create: plan.features.map(f => ({
                        featureId: f.featureId,
                        value: f.value,
                    })),
                },
            },
            include: { features: true, _count: { select: { users: true } } },
        });
    }
    async assignUsersToPlan(planId, emails) {
        const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
        if (!plan)
            throw new common_1.NotFoundException('Plan not found');
        const result = await this.prisma.user.updateMany({
            where: { email: { in: emails } },
            data: { planId },
        });
        return { count: result.count, plan };
    }
    async reorderFeatures(updates) {
        const operations = updates.map(update => this.prisma.feature.update({
            where: { id: update.id },
            data: { sortOrder: update.sortOrder },
        }));
        await this.prisma.$transaction(operations);
        return { success: true };
    }
    async getFeatures() {
        return this.prisma.feature.findMany({
            orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
            include: { planFeatures: { include: { plan: { select: { id: true, name: true, slug: true } } } } },
        });
    }
    async createFeature(dto) {
        const existing = await this.prisma.feature.findUnique({ where: { key: dto.key } });
        if (existing)
            throw new common_1.ConflictException(`Feature key "${dto.key}" already exists`);
        return this.prisma.feature.create({ data: dto });
    }
    async updateFeature(id, dto) {
        const feature = await this.prisma.feature.findUnique({ where: { id } });
        if (!feature)
            throw new common_1.NotFoundException('Feature not found');
        return this.prisma.feature.update({ where: { id }, data: dto });
    }
    async deleteFeature(id) {
        const feature = await this.prisma.feature.findUnique({ where: { id } });
        if (!feature)
            throw new common_1.NotFoundException('Feature not found');
        return this.prisma.feature.delete({ where: { id } });
    }
    async setPlanFeatureValue(planId, featureId, value) {
        const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
        if (!plan)
            throw new common_1.NotFoundException('Plan not found');
        const feature = await this.prisma.feature.findUnique({ where: { id: featureId } });
        if (!feature)
            throw new common_1.NotFoundException('Feature not found');
        return this.prisma.planFeature.upsert({
            where: { planId_featureId: { planId, featureId } },
            update: { value },
            create: { planId, featureId, value },
        });
    }
    async removePlanFeature(planId, featureId) {
        return this.prisma.planFeature.deleteMany({ where: { planId, featureId } });
    }
    async getTransactions(params) {
        const { page, limit, userId, type, from, to, search } = params;
        const skip = (page - 1) * limit;
        const where = { deletedAt: null };
        if (userId)
            where.userId = userId;
        if (type)
            where.type = type;
        if (from || to) {
            where.date = {};
            if (from)
                where.date.gte = new Date(from);
            if (to)
                where.date.lte = new Date(to);
        }
        const [transactions, total] = await Promise.all([
            this.prisma.transaction.findMany({
                where,
                skip,
                take: limit,
                orderBy: { date: 'desc' },
                include: {
                    user: { select: { id: true, email: true, fullName: true } },
                    category: { select: { id: true, name: true, emoji: true, color: true } },
                    cashbook: { select: { id: true, currency: true } },
                },
            }),
            this.prisma.transaction.count({ where }),
        ]);
        const sanitized = transactions.map(tx => ({
            ...tx,
            encNotes: undefined,
            encMerchant: undefined,
            notes: tx.encNotes ? '[Encrypted]' : null,
            merchant: tx.encMerchant ? '[Encrypted]' : null,
        }));
        return {
            data: sanitized,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async getAuditLogs(params) {
        const { page, limit, userId, action } = params;
        const skip = (page - 1) * limit;
        const where = {};
        if (userId)
            where.userId = userId;
        if (action && Object.values(client_1.AuditAction).includes(action)) {
            where.action = action;
        }
        const [logs, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { id: true, email: true, fullName: true } } },
            }),
            this.prisma.auditLog.count({ where }),
        ]);
        return {
            data: logs,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async getTickets(status, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const where = {};
        if (status)
            where.status = status;
        const [tickets, total] = await Promise.all([
            this.prisma.supportTicket.findMany({
                where,
                orderBy: { updatedAt: 'desc' },
                skip,
                take: limit,
                include: {
                    user: { select: { email: true, fullName: true, id: true } },
                    replies: { orderBy: { createdAt: 'asc' }, select: { message: true, isAdmin: true, createdAt: true } },
                },
            }),
            this.prisma.supportTicket.count({ where }),
        ]);
        return {
            data: tickets,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async updateTicketStatus(id, status) {
        const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
        if (!ticket)
            throw new common_1.NotFoundException('Ticket not found');
        return this.prisma.supportTicket.update({ where: { id }, data: { status } });
    }
    async replyTicket(adminId, ticketId, message) {
        const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
        if (!ticket)
            throw new common_1.NotFoundException('Ticket not found');
        await this.prisma.supportTicket.update({
            where: { id: ticketId },
            data: { status: 'answered' },
        });
        return this.prisma.ticketReply.create({
            data: { ticketId, authorId: adminId, message, isAdmin: true },
        });
    }
    async getSettings() {
        return this.prisma.systemSetting.findMany({ orderBy: { key: 'asc' } });
    }
    async updateSettings(settings) {
        const results = [];
        for (const setting of settings) {
            const result = await this.prisma.systemSetting.upsert({
                where: { key: setting.key },
                update: { value: setting.value, description: setting.description },
                create: { key: setting.key, value: setting.value, description: setting.description },
            });
            results.push(result);
        }
        return results;
    }
    async getAppConfig() {
        const settings = await this.prisma.systemSetting.findMany({
            where: { key: { in: exports.APP_FEATURE_KEYS } },
        });
        const configMap = {};
        for (const key of exports.APP_FEATURE_KEYS) {
            const found = settings.find(s => s.key === key);
            configMap[key] = found?.value ?? (key === 'maintenance_mode' ? 'false' : 'true');
        }
        return configMap;
    }
    async updateAppConfig(config) {
        const invalidKeys = config.filter(c => !exports.APP_FEATURE_KEYS.includes(c.key));
        if (invalidKeys.length > 0) {
            throw new common_1.BadRequestException(`Unknown config keys: ${invalidKeys.map(k => k.key).join(', ')}`);
        }
        const results = [];
        for (const item of config) {
            const result = await this.prisma.systemSetting.upsert({
                where: { key: item.key },
                update: { value: item.value },
                create: {
                    key: item.key,
                    value: item.value,
                    description: `Feature toggle: ${item.key}`,
                },
            });
            results.push(result);
        }
        return results;
    }
    async getSharedCashbooks(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [cashbooks, total] = await Promise.all([
            this.prisma.cashbook.findMany({
                where: { members: { some: {} }, deletedAt: null },
                include: {
                    user: { select: { id: true, fullName: true, email: true } },
                    members: {
                        include: { user: { select: { id: true, fullName: true, email: true } } },
                    },
                    _count: { select: { members: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.cashbook.count({ where: { members: { some: {} }, deletedAt: null } }),
        ]);
        return { data: cashbooks, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }
    async removeCashbookMember(memberId) {
        const member = await this.prisma.cashbookMember.findUnique({ where: { id: memberId } });
        if (!member)
            throw new common_1.NotFoundException('Member not found');
        await this.prisma.cashbookMember.delete({ where: { id: memberId } });
        return { message: 'Member removed by admin' };
    }
    async getTaxExportLogs(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [logs, total] = await Promise.all([
            this.prisma.taxExportLog.findMany({
                include: { user: { select: { id: true, fullName: true, email: true } } },
                orderBy: { exportedAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.taxExportLog.count(),
        ]);
        return { data: logs, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map