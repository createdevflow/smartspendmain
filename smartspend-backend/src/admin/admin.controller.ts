import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MailService } from '../mail/mail.service';

@ApiTags('admin')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly mailService: MailService,
  ) {}

  // ── Dashboard ──────────────────────────────────────────────────────────────
  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard metrics' })
  getDashboard() { return this.adminService.getDashboard(); }

  // ── Users ──────────────────────────────────────────────────────────────────
  @Get('users')
  @ApiOperation({ summary: 'List all users with optional filters' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getUsers(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('role') role?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) { return this.adminService.getUsers(search, status, role, Number(page) || 1, Number(limit) || 20); }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user detail' })
  getUserDetail(@Param('id') id: string) { return this.adminService.getUserDetail(id); }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Update user status (ACTIVE/SUSPENDED/BANNED)' })
  updateUserStatus(@Param('id') id: string, @Body() body: { status: any }) {
    return this.adminService.updateUserStatus(id, body.status);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Update user role' })
  updateUserRole(@Param('id') id: string, @Body() body: { role: any }) {
    return this.adminService.updateUserRole(id, body.role);
  }

  @Patch('users/:id/plan')
  @ApiOperation({ summary: 'Assign a plan to user' })
  assignPlanToUser(@Param('id') id: string, @Body() body: { planId: string }) {
    return this.adminService.assignPlanToUser(id, body.planId);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete user account' })
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Post('users/:id/reset')
  @ApiOperation({ summary: 'Reset user account (clear all data)' })
  resetUserAccount(@Param('id') id: string) {
    return this.adminService.resetUserAccount(id);
  }

  // ── Transactions (Admin View) ──────────────────────────────────────────────
  @Get('transactions')
  @ApiOperation({ summary: 'View all transactions across all users' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'search', required: false })
  getTransactions(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('userId') userId?: string,
    @Query('type') type?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getTransactions({
      page: Number(page) || 1,
      limit: Number(limit) || 25,
      userId, type, from, to, search,
    });
  }

  // ── Audit Logs ─────────────────────────────────────────────────────────────
  @Get('audit-logs')
  @ApiOperation({ summary: 'View audit logs' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'action', required: false })
  getAuditLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
  ) {
    return this.adminService.getAuditLogs({
      page: Number(page) || 1,
      limit: Number(limit) || 30,
      userId, action,
    });
  }

  // ── Plans ──────────────────────────────────────────────────────────────────
  @Get('plans')
  @ApiOperation({ summary: 'Get all plans' })
  getPlans() { return this.adminService.getPlans(); }

  @Post('plans')
  @ApiOperation({ summary: 'Create a plan' })
  createPlan(@Body() dto: any) { return this.adminService.createPlan(dto); }

  @Patch('plans/:id')
  @ApiOperation({ summary: 'Update a plan' })
  updatePlan(@Param('id') id: string, @Body() dto: any) { return this.adminService.updatePlan(id, dto); }

  @Delete('plans/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a plan' })
  deletePlan(@Param('id') id: string, @Query('fallbackPlanId') fallbackPlanId?: string) { 
    return this.adminService.deletePlan(id, fallbackPlanId); 
  }

  @Post('plans/:id/duplicate')
  @ApiOperation({ summary: 'Duplicate an existing plan' })
  duplicatePlan(@Param('id') id: string) {
    return this.adminService.duplicatePlan(id);
  }

  @Post('plans/:id/assign')
  @ApiOperation({ summary: 'Assign multiple users to a plan by email' })
  assignUsersToPlan(@Param('id') id: string, @Body() body: { emails: string[] }) {
    return this.adminService.assignUsersToPlan(id, body.emails);
  }

  // ── Features ──────────────────────────────────────────────────────────────
  @Get('features')
  @ApiOperation({ summary: 'Get all features' })
  getFeatures() { return this.adminService.getFeatures(); }

  @Post('features/reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reorder features' })
  reorderFeatures(@Body() body: { updates: { id: string; sortOrder: number }[] }) {
    return this.adminService.reorderFeatures(body.updates);
  }

  @Post('features')
  @ApiOperation({ summary: 'Create a feature' })
  createFeature(@Body() dto: any) { return this.adminService.createFeature(dto); }

  @Patch('features/:id')
  @ApiOperation({ summary: 'Update a feature' })
  updateFeature(@Param('id') id: string, @Body() dto: any) { return this.adminService.updateFeature(id, dto); }

  @Delete('features/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a feature' })
  deleteFeature(@Param('id') id: string) { return this.adminService.deleteFeature(id); }

  // ── Plan-Feature Values ────────────────────────────────────────────────────
  @Patch('plans/:planId/features/:featureId')
  @ApiOperation({ summary: 'Set plan feature value' })
  setPlanFeatureValue(
    @Param('planId') planId: string,
    @Param('featureId') featureId: string,
    @Body() body: { value: string },
  ) { return this.adminService.setPlanFeatureValue(planId, featureId, body.value); }

  @Delete('plans/:planId/features/:featureId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove plan feature' })
  removePlanFeature(@Param('planId') planId: string, @Param('featureId') featureId: string) {
    return this.adminService.removePlanFeature(planId, featureId);
  }

  // ── Support Tickets ────────────────────────────────────────────────────────
  @Get('tickets')
  @ApiOperation({ summary: 'Get all support tickets' })
  getTickets(
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) { return this.adminService.getTickets(status, Number(page) || 1, Number(limit) || 20); }

  @Patch('tickets/:id/status')
  @ApiOperation({ summary: 'Update ticket status' })
  updateTicketStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.adminService.updateTicketStatus(id, body.status);
  }

  @Patch('tickets/:id/reply')
  @ApiOperation({ summary: 'Reply to support ticket' })
  replyTicket(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { message: string },
  ) { return this.adminService.replyTicket(user.sub, id, body.message); }

  // ── System Settings ────────────────────────────────────────────────────────
  @Get('settings')
  @ApiOperation({ summary: 'Get all system settings' })
  getSettings() { return this.adminService.getSettings(); }

  @Patch('settings')
  @ApiOperation({ summary: 'Batch update system settings' })
  updateSettings(@Body() body: { settings: { key: string; value: string; description?: string }[] }) {
    return this.adminService.updateSettings(body.settings);
  }

  // ── App Config (Feature Toggles) ──────────────────────────────────────────
  @Get('app-config')
  @ApiOperation({ summary: 'Get all app config feature toggles' })
  getAppConfig() { return this.adminService.getAppConfig(); }

  @Patch('app-config')
  @ApiOperation({ summary: 'Update app config feature toggles' })
  updateAppConfig(@Body() body: { config: { key: string; value: string }[] }) {
    return this.adminService.updateAppConfig(body.config);
  }

  // ── Shared Cashbooks ──────────────────────────────────────────────────────
  @Get('shared-cashbooks')
  @ApiOperation({ summary: 'List shared cashbooks' })
  getSharedCashbooks(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) { return this.adminService.getSharedCashbooks(Number(page) || 1, Number(limit) || 20); }

  @Delete('shared-cashbooks/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove cashbook member' })
  removeCashbookMember(@Param('memberId') memberId: string) {
    return this.adminService.removeCashbookMember(memberId);
  }

  // ── Tax Export Logs ───────────────────────────────────────────────────────
  @Get('tax-export-logs')
  @ApiOperation({ summary: 'Get tax export logs' })
  getTaxExportLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) { return this.adminService.getTaxExportLogs(Number(page) || 1, Number(limit) || 20); }

  // ── Test Email ────────────────────────────────────────────────────────────
  @Post('test-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a test email to verify SMTP configuration' })
  async sendTestEmail(
    @CurrentUser() user: any,
    @Body() body: { email?: string },
  ) {
    const target = body.email || user.email;
    // Invalidate transporter cache so new SMTP settings take effect immediately
    this.mailService.invalidateCache();
    await this.mailService.sendTestEmail(target);
    return { message: `Test email sent to ${target}` };
  }
}
