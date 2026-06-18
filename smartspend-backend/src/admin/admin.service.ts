import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

// ── Feature toggle keys for AppConfig ───────────────────────────────────────
export const APP_FEATURE_KEYS = [
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
  // Legacy feature flags
  'feature_whatsapp_active',
  'feature_ocr_active',
  'feature_gamification_active',
  'feature_shared_cashbooks_active',
  'feature_tax_export_active',
  'feature_panic_button_active',
];

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ── Dashboard ────────────────────────────────────────────────────────────────

  async getDashboard() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalUsers, activeUsers, totalTx, totalBooks,
      newUsersThisMonth, verifiedUsers, suspendedUsers,
      totalBudgets, totalGoals, totalDevices,
      recentFailedLogins,
    ] = await Promise.all([
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
      this.prisma.auditLog.count({ where: { action: AuditAction.LOGIN_FAILED, createdAt: { gte: startOfMonth } } }),
    ]);

    // Monthly new users trend (last 6 months)
    const monthlyTrend: { month: string; users: number }[] = [];
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

    // Recent audit events
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

  // ── Users ────────────────────────────────────────────────────────────────────

  async getUsers(
    search?: string,
    status?: string,
    role?: string,
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };
    if (status) where.status = status;
    if (role) where.role = role;
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

  async getUserDetail(id: string) {
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
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUserStatus(id: string, status: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const updated = await this.prisma.user.update({ where: { id }, data: { status } });
    const { passwordHash, encryptionKeySalt, ...safe } = updated;
    return safe;
  }

  async updateUserRole(id: string, role: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const updated = await this.prisma.user.update({ where: { id }, data: { role } });
    const { passwordHash, encryptionKeySalt, ...safe } = updated;
    return safe;
  }

  async assignPlanToUser(userId: string, planId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');
    const updated = await this.prisma.user.update({ where: { id: userId }, data: { planId } });
    const { passwordHash, encryptionKeySalt, ...safe } = updated;
    return safe;
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    // Soft delete
    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'BANNED',
        email: `deleted_${Date.now()}_${user.email}`, // Free up email for re-registration
      },
    });
    // Invalidate all sessions
    await this.prisma.session.updateMany({
      where: { userId: id },
      data: { isValid: false },
    });
    return { message: 'User account deleted successfully' };
  }

  async resetUserAccount(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    // Delete all user data in correct order (respecting FK constraints)
    await this.prisma.$transaction([
      this.prisma.transaction.updateMany({ where: { userId: id }, data: { deletedAt: new Date() } }),
      this.prisma.budget.updateMany({ where: { userId: id }, data: { isActive: false } }),
      this.prisma.goal.updateMany({ where: { userId: id }, data: { status: 'CANCELLED' } }),
      this.prisma.cashbook.updateMany({ where: { userId: id }, data: { deletedAt: new Date() } }),
      this.prisma.session.updateMany({ where: { userId: id }, data: { isValid: false } }),
    ]);

    return { message: 'User account data has been reset' };
  }

  // ── Plans ────────────────────────────────────────────────────────────────────

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

  async createPlan(dto: {
    name: string; slug: string; description?: string; tagline?: string;
    color?: string; isActive?: boolean; isDefault?: boolean;
    sortOrder?: number; priceMonthly?: number; priceYearly?: number;
  }) {
    const existing = await this.prisma.plan.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException(`Plan with slug "${dto.slug}" already exists`);
    return this.prisma.plan.create({ data: dto });
  }

  async updatePlan(id: string, dto: Partial<{
    name: string; slug: string; description: string; tagline: string;
    color: string; isActive: boolean; isDefault: boolean;
    sortOrder: number; priceMonthly: number; priceYearly: number;
  }>) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');
    return this.prisma.plan.update({ where: { id }, data: dto });
  }

  async deletePlan(id: string, fallbackPlanId?: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (!plan) throw new NotFoundException('Plan not found');

    if (plan._count.users > 0) {
      if (!fallbackPlanId) {
        throw new BadRequestException('Plan has active users. Please provide a fallback plan ID to migrate users.');
      }
      const fallbackPlan = await this.prisma.plan.findUnique({ where: { id: fallbackPlanId } });
      if (!fallbackPlan) throw new NotFoundException('Fallback plan not found');

      // Migrate users
      await this.prisma.user.updateMany({
        where: { planId: id },
        data: { planId: fallbackPlanId },
      });
    }

    return this.prisma.plan.delete({ where: { id } });
  }

  async duplicatePlan(id: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      include: { features: true },
    });
    if (!plan) throw new NotFoundException('Plan not found');

    const newSlug = `${plan.slug}-copy-${Date.now()}`;
    return this.prisma.plan.create({
      data: {
        name: `${plan.name} (Copy)`,
        slug: newSlug,
        description: plan.description,
        tagline: plan.tagline,
        color: plan.color,
        isActive: false, // Default to inactive when copying
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

  async assignUsersToPlan(planId: string, emails: string[]) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');

    const result = await this.prisma.user.updateMany({
      where: { email: { in: emails } },
      data: { planId },
    });

    return { count: result.count, plan };
  }

  // ── Features ─────────────────────────────────────────────────────────────────

  async reorderFeatures(updates: { id: string; sortOrder: number }[]) {
    const operations = updates.map(update => 
      this.prisma.feature.update({
        where: { id: update.id },
        data: { sortOrder: update.sortOrder },
      })
    );
    await this.prisma.$transaction(operations);
    return { success: true };
  }

  async getFeatures() {
    return this.prisma.feature.findMany({
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
      include: { planFeatures: { include: { plan: { select: { id: true, name: true, slug: true } } } } },
    });
  }

  async createFeature(dto: {
    key: string; name: string; description?: string; type: string;
    defaultValue: string; unit?: string; category?: string;
    isVisible?: boolean; sortOrder?: number;
  }) {
    const existing = await this.prisma.feature.findUnique({ where: { key: dto.key } });
    if (existing) throw new ConflictException(`Feature key "${dto.key}" already exists`);
    return this.prisma.feature.create({ data: dto });
  }

  async updateFeature(id: string, dto: Partial<{
    key: string; name: string; description: string; type: string;
    defaultValue: string; unit: string; category: string; isVisible: boolean; sortOrder: number;
  }>) {
    const feature = await this.prisma.feature.findUnique({ where: { id } });
    if (!feature) throw new NotFoundException('Feature not found');
    return this.prisma.feature.update({ where: { id }, data: dto });
  }

  async deleteFeature(id: string) {
    const feature = await this.prisma.feature.findUnique({ where: { id } });
    if (!feature) throw new NotFoundException('Feature not found');
    return this.prisma.feature.delete({ where: { id } });
  }

  async setPlanFeatureValue(planId: string, featureId: string, value: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');
    const feature = await this.prisma.feature.findUnique({ where: { id: featureId } });
    if (!feature) throw new NotFoundException('Feature not found');

    return this.prisma.planFeature.upsert({
      where: { planId_featureId: { planId, featureId } },
      update: { value },
      create: { planId, featureId, value },
    });
  }

  async removePlanFeature(planId: string, featureId: string) {
    return this.prisma.planFeature.deleteMany({ where: { planId, featureId } });
  }

  // ── Transactions (Admin View) ─────────────────────────────────────────────────

  async getTransactions(params: {
    page: number; limit: number;
    userId?: string; type?: string;
    from?: string; to?: string; search?: string;
  }) {
    const { page, limit, userId, type, from, to, search } = params;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
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

    // Return transactions without decrypting notes (admin privacy)
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

  // ── Audit Logs ────────────────────────────────────────────────────────────────

  async getAuditLogs(params: {
    page: number; limit: number; userId?: string; action?: string;
  }) {
    const { page, limit, userId, action } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) where.userId = userId;
    // Cast string to AuditAction enum if provided
    if (action && Object.values(AuditAction).includes(action as AuditAction)) {
      where.action = action as AuditAction;
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

  // ── Tickets ──────────────────────────────────────────────────────────────────

  async getTickets(status?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;

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

  async updateTicketStatus(id: string, status: string) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return this.prisma.supportTicket.update({ where: { id }, data: { status } });
  }

  async replyTicket(adminId: string, ticketId: string, message: string) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: 'answered' },
    });
    return this.prisma.ticketReply.create({
      data: { ticketId, authorId: adminId, message, isAdmin: true },
    });
  }

  // ── System Settings ──────────────────────────────────────────────────────────

  async getSettings() {
    return this.prisma.systemSetting.findMany({ orderBy: { key: 'asc' } });
  }

  async updateSettings(settings: { key: string; value: string; description?: string }[]) {
    const results: any[] = [];
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

  // ── App Config (Feature Toggles) ─────────────────────────────────────────────

  async getAppConfig() {
    // Get all known feature toggle keys from SystemSetting
    const settings = await this.prisma.systemSetting.findMany({
      where: { key: { in: APP_FEATURE_KEYS } },
    });

    // Build a map, defaulting missing keys to 'true'
    const configMap: Record<string, string> = {};
    for (const key of APP_FEATURE_KEYS) {
      const found = settings.find(s => s.key === key);
      // maintenance_mode defaults to false, all features default to true
      configMap[key] = found?.value ?? (key === 'maintenance_mode' ? 'false' : 'true');
    }

    return configMap;
  }

  async updateAppConfig(config: { key: string; value: string }[]) {
    // Validate keys
    const invalidKeys = config.filter(c => !APP_FEATURE_KEYS.includes(c.key));
    if (invalidKeys.length > 0) {
      throw new BadRequestException(`Unknown config keys: ${invalidKeys.map(k => k.key).join(', ')}`);
    }

    const results: any[] = [];
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

  // ── Shared Cashbooks ────────────────────────────────────────────────────────

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

  async removeCashbookMember(memberId: string) {
    const member = await this.prisma.cashbookMember.findUnique({ where: { id: memberId } });
    if (!member) throw new NotFoundException('Member not found');
    await this.prisma.cashbookMember.delete({ where: { id: memberId } });
    return { message: 'Member removed by admin' };
  }

  // ── Tax Export Logs ─────────────────────────────────────────────────────────

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
}
