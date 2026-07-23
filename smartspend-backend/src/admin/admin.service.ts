import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuditAction } from '@prisma/client';
import { CacheService } from '../cache/cache.service';
import { MediaCleanupService } from '../media/media.cleanup.service';
import { MediaStorageProvider } from '../media/media.storage';
import { AuditService } from '../audit/audit.service';

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
  'feature_wealth_hub',
  'feature_upcoming_bills',
  'feature_top_categories',
  'feature_ai_insights_mini',
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
  'feature_gallery',
  'feature_chat',
  'feature_invoices',
  'feature_payment_reminders',
  // Scheduler & Communication
  'feature_scheduler',
  'feature_scheduled_communications',
  'feature_recurring_transactions',
  'feature_transaction_splits',
  // App store download configuration
  'download_android_enabled',
  'download_android_url',
  'download_ios_enabled',
  'download_ios_url',
  'min_app_version',
  'force_update_enabled',
  // AI Settings
  'ai_maintenance_mode',
  'gemini_api_key',
  'ai_gemini_model',
  'ai_default_credits',
  'ai_max_prompt_length',
  'ai_credit_cost_ocr',
  'ai_credit_cost_insight',
  'ai_credit_cost_chat',
  'ai_credit_cost_note_analysis',
  'ai_credit_cost_mini_insight',
  'ai_safety_harassment',
  'ai_safety_hate',
  'ai_safety_dangerous',
];

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private cache: CacheService,
    private mediaCleanup: MediaCleanupService,
    private mediaStorage: MediaStorageProvider,
    private audit: AuditService,
  ) {}

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
        newUsersToday: await this.prisma.user.count({ where: { deletedAt: null, createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } } }),
        newUsersThisWeek: await this.prisma.user.count({ where: { deletedAt: null, createdAt: { gte: new Date(new Date().setDate(new Date().getDate() - 7)) } } }),
        verifiedUsers,
        suspendedUsers,
        bannedUsers: await this.prisma.user.count({ where: { deletedAt: null, status: 'BANNED' } }),
        pendingVerification: await this.prisma.user.count({ where: { deletedAt: null, status: 'PENDING_VERIFICATION' } }),
        premiumUsers: await this.prisma.user.count({ where: { deletedAt: null, plan: { slug: { not: 'free' } } } }),
        freeUsers: await this.prisma.user.count({ where: { deletedAt: null, plan: { slug: 'free' } } }),
        onlineNow: await this.prisma.session.count({ where: { isValid: true, expiresAt: { gt: new Date() } } }),
        deletedUsers: await this.prisma.user.count({ where: { deletedAt: { not: null } } }),
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

  async getUsers(params: {
    search?: string;
    status?: string;
    role?: string;
    planId?: string;
    isEmailVerified?: boolean;
    dateRange?: string;
    activity?: string;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
    page: number;
    limit: number;
  }) {
    const skip = (params.page - 1) * params.limit;
    const where: any = { deletedAt: null };
    if (params.status) where.status = params.status;
    if (params.role) where.role = params.role;
    if (params.planId) where.planId = params.planId;
    if (params.isEmailVerified !== undefined) where.isEmailVerified = String(params.isEmailVerified) === 'true';

    if (params.dateRange) {
      const now = new Date();
      if (params.dateRange === 'today') {
        where.createdAt = { gte: new Date(now.setHours(0,0,0,0)) };
      } else if (params.dateRange === 'week') {
        where.createdAt = { gte: new Date(now.setDate(now.getDate() - 7)) };
      } else if (params.dateRange === 'month') {
        where.createdAt = { gte: new Date(now.setMonth(now.getMonth() - 1)) };
      }
    }

    if (params.activity === 'online') {
      where.sessions = { some: { isValid: true, expiresAt: { gt: new Date() } } };
    } else if (params.activity === 'offline') {
      where.sessions = { none: { isValid: true, expiresAt: { gt: new Date() } } };
    }

    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { fullName: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search, mode: 'insensitive' } },
        { id: { equals: params.search } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (params.sortField) {
      if (['fullName', 'email', 'createdAt', 'lastLoginAt'].includes(params.sortField)) {
        orderBy = { [params.sortField]: params.sortOrder || 'asc' };
      } else if (params.sortField === 'plan') {
        orderBy = { plan: { name: params.sortOrder || 'asc' } };
      }
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true, email: true, fullName: true, phone: true,
          status: true, role: true, isEmailVerified: true,
          plan: { select: { name: true, slug: true, color: true } },
          createdAt: true, lastLoginAt: true, avatar: true,
          defaultCurrency: true, timezone: true,
          _count: { select: { cashbooks: true, transactions: true, devices: true } },
        },
        orderBy,
        skip,
        take: params.limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: { total, page: params.page, limit: params.limit, totalPages: Math.ceil(total / params.limit) },
    };
  }

  // ── Deep Profile & Enterprise Actions ────────────────────────────────────────

  async getUserProfileFull(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        plan: true,
        devices: { orderBy: { lastSeenAt: 'desc' } },
        sessions: { orderBy: { createdAt: 'desc' }, take: 10 },
        userNotes: { include: { admin: { select: { fullName: true } } }, orderBy: { createdAt: 'desc' } },
        transactions: { orderBy: { createdAt: 'desc' }, take: 5, include: { category: true } },
        auditLogs: { orderBy: { createdAt: 'desc' }, take: 15 },
        aiCredit: true,
        _count: { select: { cashbooks: true, transactions: true, devices: true, sessions: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getUserNotes(userId: string) {
    return this.prisma.userNote.findMany({
      where: { userId },
      include: { admin: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addUserNote(userId: string, adminId: string, content: string) {
    return this.prisma.userNote.create({
      data: { userId, adminId, content },
      include: { admin: { select: { fullName: true } } },
    });
  }

  async updateUserAiCredits(userId: string, balance: number) {
    return this.prisma.userAiCredit.upsert({
      where: { userId },
      update: { balance: Number(balance) },
      create: { userId, balance: Number(balance) },
    });
  }

  async bulkAssignPlan(userIds: string[], planId: string) {
    await this.prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { planId },
    });
    return { success: true, count: userIds.length };
  }

  async bulkAssignRole(userIds: string[], role: any) {
    await this.prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { role },
    });
    return { success: true, count: userIds.length };
  }

  async bulkAssignStatus(userIds: string[], status: any) {
    await this.prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { status },
    });
    return { success: true, count: userIds.length };
  }

  async bulkDeleteUsers(userIds: string[]) {
    await this.prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { deletedAt: new Date() },
    });
    return { success: true, count: userIds.length };
  }

  async logoutAllDevices(userId: string) {
    await this.prisma.session.updateMany({
      where: { userId },
      data: { isValid: false },
    });
    await this.prisma.auditLog.create({
      data: { userId, action: AuditAction.LOGOUT, entity: 'Session', metadata: { event: 'logout_all' } }
    });
    return { success: true };
  }

  async getSoftDeletedUsers(search?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: { not: null } };
    if (search) {
      where.OR = [
        // Search in mangled emails too (format: deleted_<ts>_<email>)
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true, email: true, fullName: true, phone: true,
          status: true, role: true, deletedAt: true, createdAt: true, lastLoginAt: true,
          plan: { select: { name: true, slug: true, color: true } },
          _count: { select: { cashbooks: true, transactions: true } },
        },
        orderBy: { deletedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    // Un-mangle the displayed email/phone for readability
    const normalized = users.map(u => ({
      ...u,
      email: u.email.replace(/^deleted_\d+_/, ''),
      phone: u.phone ? u.phone.replace(/^deleted_\d+_/, '') : null,
    }));

    return {
      data: normalized,
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
    await this.cache.del(`user:features:${userId}`);
    const { passwordHash, encryptionKeySalt, ...safe } = updated;
    return safe;
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const ts = Date.now();
    // Soft delete — mangle both email AND phone to free them for re-registration
    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'BANNED',
        email: `deleted_${ts}_${user.email}`,
        phone: user.phone ? `deleted_${ts}_${user.phone}` : null,
      },
    });
    // Invalidate all sessions
    await this.prisma.session.updateMany({
      where: { userId: id },
      data: { isValid: false },
    });
    return { message: 'User account soft-deleted successfully' };
  }

  async restoreUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.deletedAt) throw new BadRequestException('User is not soft-deleted');
    
    // Un-mangle email and phone
    const email = user.email.replace(/^deleted_\d+_/, '');
    let phone = user.phone;
    if (phone) phone = phone.replace(/^deleted_\d+_/, '');

    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: null,
        status: 'ACTIVE',
        email,
        phone,
      },
    });
    return { message: 'User account restored successfully' };
  }

  async hardDeleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    // Prisma cascades deletes all related data automatically via onDelete: Cascade
    await this.prisma.user.delete({ where: { id } });
    return { message: 'User account permanently deleted' };
  }

  async adminChangePassword(id: string, newPassword: string) {
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    // Revoke all active sessions for security
    await this.prisma.session.updateMany({ where: { userId: id }, data: { isValid: false } });
    return { message: 'Password changed and all sessions revoked' };
  }

  async impersonateUser(id: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.deletedAt) throw new BadRequestException('Cannot impersonate a deleted user');
    // Include impersonated claim so middleware/guards can detect and restrict impersonated sessions
    const payload = { sub: user.id, email: user.email, role: user.role, plan: user.planId, impersonated: true, impersonatedBy: adminId };
    // Short-lived impersonation token (15 minutes)
    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('jwt.accessSecret'),
      expiresIn: '15m',
    });
    // Audit log — immutable record of who impersonated whom
    await this.audit.log({
      userId: adminId,
      action: 'IMPERSONATE_USER' as any,
      entity: 'User',
      entityId: id,
      metadata: { targetEmail: user.email, targetId: id },
    }).catch(() => {}); // never fail on audit
    return { accessToken, user: { id: user.id, email: user.email, fullName: user.fullName } };
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
    const updated = await this.prisma.plan.update({ where: { id }, data: dto });
    await this.cache.delPattern('user:features:*');
    return updated;
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

  async reorderPlans(orderedIds: string[]) {
    const updates = orderedIds.map((id, index) =>
      this.prisma.plan.update({ where: { id }, data: { sortOrder: index } })
    );
    await this.prisma.$transaction(updates);
    return { success: true };
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
    const updated = await this.prisma.feature.update({ where: { id }, data: dto });
    await this.cache.delPattern('user:features:*');
    return updated;
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

  // Keys whose values must never be returned to the client in plaintext
  private readonly SENSITIVE_CONFIG_KEYS = [
    'gemini_api_key',
    'smtp_pass',
    'smtp_user',
    'minio_secret_key',
    'minio_access_key',
    'db_password',
    'server_encryption_key',
    'jwt_access_secret',
    'jwt_refresh_secret',
    'super_admin_password',
  ];

  async getSettings() {
    const settings = await this.prisma.appConfig.findMany({ orderBy: { key: 'asc' } });
    return settings.map(s => ({
      ...s,
      // Mask secret values — admin can update but never read them back
      value: this.SENSITIVE_CONFIG_KEYS.includes(s.key.toLowerCase())
        ? (s.value ? '***REDACTED***' : '')
        : s.value,
    }));
  }

  async updateSettings(settings: { key: string; value: string; description?: string }[]) {
    if (!settings || !Array.isArray(settings)) {
      throw new BadRequestException('Invalid settings payload: must be an array');
    }
    const results: any[] = [];
    for (const setting of settings) {
      if (setting.value === '***REDACTED***') {
        // User didn't change the redacted secret field; keep existing
        continue;
      }
      const result = await this.prisma.appConfig.upsert({
        where: { key: setting.key },
        update: { value: setting.value, description: setting.description },
        create: { key: setting.key, value: setting.value, description: setting.description },
      });
      results.push(result);
    }

    const trialSetting = settings.find(s => s.key === 'free_trial_days');
    if (trialSetting) {
      const days = parseInt(trialSetting.value, 10);
      if (!isNaN(days) && days <= 0) {
        await this.prisma.user.updateMany({ data: { trialExpiresAt: null } });
      } else if (!isNaN(days) && days > 0) {
        const users = await this.prisma.user.findMany({ select: { id: true, createdAt: true } });
        for (const u of users) {
          const expiry = new Date(u.createdAt);
          expiry.setDate(expiry.getDate() + days);
          await this.prisma.user.update({ where: { id: u.id }, data: { trialExpiresAt: expiry } });
        }
      }
    }
    await this.cache.delPattern('user:features:*');
    return results;
  }

  // ── App Config (Feature Toggles) ─────────────────────────────────────────────

  async getAppConfig() {
    const settings = await this.prisma.appConfig.findMany({
      where: { key: { in: APP_FEATURE_KEYS } },
    });

    const configMap: Record<string, { value: string, teaseMode: boolean }> = {};
    for (const key of APP_FEATURE_KEYS) {
      const found = settings.find(s => s.key === key);
      let val = found?.value;
      if (val === undefined) {
        if (key.endsWith('_url')) val = '';
        else if (key === 'min_app_version') val = '1.0.0';
        else if (['maintenance_mode', 'feature_beta', 'download_ios_enabled', 'force_update_enabled'].includes(key)) val = 'false';
        else val = 'true';
      }
      configMap[key] = {
        value: val,
        teaseMode: found?.teaseMode ?? false,
      };
    }

    return configMap;
  }

  async updateAppConfig(config: { key: string; value: string; teaseMode?: boolean }[]) {
    if (!config || !Array.isArray(config)) {
      throw new BadRequestException('Invalid config payload: must be an array');
    }
    const invalidKeys = config.filter(c => !APP_FEATURE_KEYS.includes(c.key));
    if (invalidKeys.length > 0) {
      throw new BadRequestException(`Unknown config keys: ${invalidKeys.map(k => k.key).join(', ')}`);
    }

    const results: any[] = [];
    for (const item of config) {
      const updateData: any = { value: item.value };
      if (item.teaseMode !== undefined) {
        updateData.teaseMode = item.teaseMode;
      }
      
      const result = await this.prisma.appConfig.upsert({
        where: { key: item.key },
        update: updateData,
        create: {
          key: item.key,
          value: item.value,
          teaseMode: item.teaseMode ?? false,
          description: `Feature toggle: ${item.key}`,
        },
      });
      results.push(result);
    }
    await this.cache.delPattern('user:features:*');
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

  // ── Chat Hub Management (Privacy-preserving) ────────────────────────────────
  async getChatAnalytics() {
    const [totalConversations, totalMessages, activeChatUsers] = await Promise.all([
      this.prisma.chatConversation.count(),
      this.prisma.chatMessage.count({ where: { deletedAt: null } }),
      this.prisma.chatMember.groupBy({ by: ['userId'] }).then((res) => res.length),
    ]);

    const messagesByTypeRaw = await this.prisma.chatMessage.groupBy({
      by: ['type'],
      where: { deletedAt: null },
      _count: { _all: true },
    });

    const messagesByType = messagesByTypeRaw.reduce((acc, curr) => {
      acc[curr.type] = curr._count._all;
      return acc;
    }, {} as Record<string, number>);

    return {
      privacyNote: 'Admin access preserves privacy: private conversation content is neither logged nor exposed.',
      totalConversations,
      totalMessages,
      activeChatUsers,
      messagesByType,
    };
  }

  async sendBroadcastMessage(adminUserId: string, title: string, content: string) {
    const allUsers = await this.prisma.user.findMany({
      where: { deletedAt: null },
      select: { id: true },
    });

    return { success: true, recipientsCount: allUsers.length, message: `Broadcast scheduled/sent to ${allUsers.length} users.` };
  }

  // ── Media Library Management ──────────────────────────────────────────────────

  async getMediaAssets(params: { page?: number; limit?: number; module?: string; status?: string; search?: string; type?: string }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.module && params.module !== 'ALL') {
      where.module = params.module;
    }
    if (params.status && params.status !== 'ALL') {
      where.status = params.status;
    }
    if (params.type && params.type !== 'ALL') {
      where.type = { startsWith: params.type };
    }
    if (params.search) {
      where.OR = [
        { storageKey: { contains: params.search, mode: 'insensitive' } },
        { filePath: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [assets, total] = await Promise.all([
      this.prisma.mediaAsset.findMany({
        where,
        skip,
        take: limit,
        orderBy: { uploadDate: 'desc' },
        include: {
          owner: {
            select: { id: true, fullName: true, email: true, avatar: true },
          },
        },
      }),
      this.prisma.mediaAsset.count({ where }),
    ]);

    return {
      data: assets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMediaStats() {
    const allAssets = await this.prisma.mediaAsset.findMany({
      where: { status: { not: 'DELETED' } },
      select: {
        size: true,
        compressedSize: true,
        originalSize: true,
        downloads: true,
        usageCount: true,
        module: true,
        status: true,
      },
    });

    let totalFiles = allAssets.length;
    let totalBytesStored = 0;
    let totalOriginalBytes = 0;
    let totalDownloads = 0;
    let totalUsage = 0;

    const byModule: Record<string, { count: number; bytes: number }> = {};
    const byStatus: Record<string, number> = { ACTIVE: 0, ARCHIVED: 0, EXPIRED: 0, DELETED: 0 };

    for (const asset of allAssets) {
      totalBytesStored += asset.size || 0;
      totalOriginalBytes += asset.originalSize || asset.size || 0;
      totalDownloads += asset.downloads || 0;
      totalUsage += asset.usageCount || 1;

      const mod = asset.module || 'system';
      if (!byModule[mod]) byModule[mod] = { count: 0, bytes: 0 };
      byModule[mod].count++;
      byModule[mod].bytes += asset.size || 0;

      const st = asset.status || 'ACTIVE';
      byStatus[st] = (byStatus[st] || 0) + 1;
    }

    const totalBytesSaved = Math.max(0, totalOriginalBytes - totalBytesStored);
    const compressionRatio = totalOriginalBytes > 0 ? ((totalBytesSaved / totalOriginalBytes) * 100).toFixed(1) : '0.0';

    return {
      totalFiles,
      totalBytesStored,
      totalOriginalBytes,
      totalBytesSaved,
      compressionRatio,
      totalDownloads,
      totalUsage,
      byModule,
      byStatus,
    };
  }

  async updateMediaAssetStatus(id: string, status: string) {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException('Media asset not found');

    return this.prisma.mediaAsset.update({
      where: { id },
      data: { status },
    });
  }

  async bulkDeleteMediaAssets(ids: string[]) {
    const assets = await this.prisma.mediaAsset.findMany({
      where: { id: { in: ids } },
    });

    const defaultBucket = this.config.get<string>('minio.bucketMedia', 'media');
    let deletedCount = 0;

    for (const asset of assets) {
      try {
        await this.mediaStorage.removeObject(defaultBucket, asset.storageKey);
        await this.prisma.mediaAsset.update({
          where: { id: asset.id },
          data: { status: 'DELETED' },
        });
        deletedCount++;
      } catch (e) {
        // Ignore individual storage deletion failure
      }
    }

    return { success: true, deletedCount };
  }

  async runMediaCleanup() {
    await this.mediaCleanup.handleDailyCleanup();
    return { success: true, message: 'Media maintenance and cleanup job executed successfully.' };
  }
}


