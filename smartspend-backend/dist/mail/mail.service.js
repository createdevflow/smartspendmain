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
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = require("nodemailer");
const prisma_service_1 = require("../prisma/prisma.service");
let MailService = MailService_1 = class MailService {
    constructor(config, prisma) {
        this.config = config;
        this.prisma = prisma;
        this.logger = new common_1.Logger(MailService_1.name);
        this.cachedTransporter = null;
        this.cacheExpiresAt = 0;
    }
    async getTransporter() {
        const now = Date.now();
        if (this.cachedTransporter && now < this.cacheExpiresAt) {
            return this.cachedTransporter;
        }
        const keys = ['smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_pass'];
        const rows = await this.prisma.appConfig.findMany({
            where: { key: { in: keys } },
        });
        const db = {};
        for (const row of rows)
            db[row.key] = row.value;
        const host = db['smtp_host'] || this.config.get('mail.host') || '';
        const port = parseInt(db['smtp_port'] || String(this.config.get('mail.port') ?? 587), 10);
        const secure = (db['smtp_secure'] ?? String(this.config.get('mail.secure') ?? false)) === 'true';
        const user = db['smtp_user'] || this.config.get('mail.user') || '';
        const pass = db['smtp_pass'] || this.config.get('mail.pass') || '';
        this.cachedTransporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: user && pass ? { user, pass } : undefined,
            tls: { rejectUnauthorized: false },
        });
        this.cacheExpiresAt = now + 60_000;
        return this.cachedTransporter;
    }
    invalidateCache() {
        this.cachedTransporter = null;
        this.cacheExpiresAt = 0;
    }
    async getFrom() {
        const rows = await this.prisma.appConfig.findMany({
            where: { key: { in: ['mail_from_name', 'mail_from_address'] } },
        });
        const db = {};
        for (const row of rows)
            db[row.key] = row.value;
        const name = db['mail_from_name'] || this.config.get('mail.fromName') || 'Cashtro';
        const addr = db['mail_from_address'] || this.config.get('mail.fromAddress') || '';
        return `"${name}" <${addr}>`;
    }
    async sendOtp(email, name, otp, purpose) {
        const isVerify = purpose === 'email_verify';
        if (this.config.get('NODE_ENV') === 'development') {
            this.logger.log(`[DEV MODE] ✉️ Email to ${email} | OTP: ${otp}`);
            return;
        }
        try {
            const transporter = await this.getTransporter();
            const from = await this.getFrom();
            await transporter.sendMail({
                from,
                to: email,
                subject: isVerify ? '✉️ Verify your Cashtro account' : '🔑 Reset your Cashtro password',
                html: this.otpTemplate(name, otp, isVerify),
            });
            this.logger.log(`OTP email sent to ${email} (purpose: ${purpose})`);
        }
        catch (e) {
            this.logger.error(`Failed to send OTP email to ${email}:`, e);
            throw e;
        }
    }
    async sendTestEmail(toEmail) {
        const transporter = await this.getTransporter();
        const from = await this.getFrom();
        await transporter.sendMail({
            from,
            to: toEmail,
            subject: '✅ Cashtro SMTP Test — Configuration Working',
            html: `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body{background:#F8FAFC;font-family:-apple-system,sans-serif;}
  .w{max-width:500px;margin:40px auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.1);}
  .h{background:linear-gradient(135deg,#1E3A8A,#2563EB);padding:32px;text-align:center;color:#fff;}
  .b{padding:32px;}
  .badge{display:inline-block;background:#DCFCE7;color:#166534;border:1px solid #86EFAC;padding:8px 20px;border-radius:999px;font-weight:700;font-size:15px;margin:20px 0;}
</style></head><body>
<div class="w">
  <div class="h"><div style="font-size:40px">✅</div><h1 style="font-size:22px;margin:8px 0">Email Delivery Confirmed</h1></div>
  <div class="b">
    <p style="color:#0F172A;font-size:16px;font-weight:600">Your SMTP configuration is working!</p>
    <div class="badge">✓ Test email delivered successfully</div>
    <p style="color:#64748B;margin-top:12px">All transactional emails (OTP verification, password reset, budget alerts) will now be delivered to your users.</p>
  </div>
  <div style="padding:20px 32px;background:#F8FAFC;text-align:center;font-size:12px;color:#94A3B8;border-top:1px solid #E2E8F0">
    © ${new Date().getFullYear()} Cashtro Admin
  </div>
</div></body></html>`,
        });
    }
    async sendBudgetAlert(email, name, budgetName, percentage, spent, limit) {
        const transporter = await this.getTransporter();
        const from = await this.getFrom();
        await transporter.sendMail({
            from,
            to: email,
            subject: `⚠️ Budget Alert: ${budgetName} is ${percentage}% spent`,
            html: this.budgetAlertTemplate(name, budgetName, percentage, spent, limit),
        });
    }
    async sendMonthlyReport(email, name, month, income, expense, savings) {
        const transporter = await this.getTransporter();
        const from = await this.getFrom();
        await transporter.sendMail({
            from,
            to: email,
            subject: `📊 Your Cashtro report for ${month}`,
            html: this.monthlyReportTemplate(name, month, income, expense, savings),
        });
    }
    otpTemplate(name, otp, isVerify) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isVerify ? 'Verify Email' : 'Reset Password'} - Cashtro</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .wrapper { max-width: 500px; margin: 40px auto; background: #fff; border-radius: 24px; overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,.10); }
    .header { background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #3B82F6 100%); padding: 40px 32px; text-align: center; }
    .logo-icon { font-size: 40px; display: block; margin-bottom: 10px; }
    .logo-text { font-size: 26px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
    .body { padding: 36px 32px; }
    .greeting { font-size: 18px; font-weight: 600; color: #0F172A; margin-bottom: 12px; }
    .description { font-size: 15px; color: #64748B; line-height: 1.6; margin-bottom: 28px; }
    .otp-box { background: linear-gradient(135deg, #EFF6FF, #DBEAFE); border: 2px dashed #93C5FD; border-radius: 20px; padding: 28px; text-align: center; margin-bottom: 24px; }
    .otp-label { font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; }
    .otp-code { font-size: 44px; font-weight: 800; color: #1D4ED8; letter-spacing: 12px; font-variant-numeric: tabular-nums; }
    .expiry { font-size: 13px; color: #94A3B8; text-align: center; margin-bottom: 24px; }
    .warning { background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 12px; padding: 14px 18px; font-size: 13px; color: #92400E; }
    .footer { background: #F8FAFC; padding: 24px 32px; text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #E2E8F0; }
    .footer a { color: #2563EB; text-decoration: none; }
  </style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <span class="logo-icon">💰</span>
    <div class="logo-text">Cashtro</div>
  </div>
  <div class="body">
    <p class="greeting">Hi ${name} 👋</p>
    <p class="description">${isVerify
            ? "Welcome to Cashtro! You're one step away from taking control of your finances. Use the code below to verify your email address."
            : "We received a request to reset your password. Use the code below to create a new password. If you didn't request this, please ignore this email."}</p>
    <div class="otp-box">
      <div class="otp-label">Your verification code</div>
      <div class="otp-code">${otp}</div>
    </div>
    <p class="expiry">⏱️ This code expires in <strong>10 minutes</strong></p>
    <div class="warning">
      🔒 <strong>Security tip:</strong> Never share this code with anyone. Cashtro will never ask for this code via phone or chat.
    </div>
  </div>
  <div class="footer">
    © ${new Date().getFullYear()} Cashtro · Your trusted finance companion<br>
    If you didn't request this, you can safely ignore this email.
  </div>
</div>
</body>
</html>`;
    }
    budgetAlertTemplate(name, budgetName, pct, spent, limit) {
        const color = pct >= 100 ? '#EF4444' : pct >= 80 ? '#F59E0B' : '#3B82F6';
        return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body { background:#F8FAFC; font-family: -apple-system,sans-serif; }
  .wrapper { max-width:500px; margin:40px auto; background:#fff; border-radius:24px; overflow:hidden; box-shadow:0 8px 40px rgba(0,0,0,.1); }
  .header { background:linear-gradient(135deg,#1E3A8A,#2563EB); padding:32px; text-align:center; color:#fff; }
  .body { padding:32px; }
  .progress-bar { background:#E2E8F0; border-radius:999px; height:12px; margin:16px 0; }
  .progress-fill { background:${color}; border-radius:999px; height:12px; width:${Math.min(pct, 100)}%; }
  .footer { padding:20px 32px; text-align:center; font-size:12px; color:#94A3B8; border-top:1px solid #E2E8F0; }
</style></head>
<body><div class="wrapper">
  <div class="header"><h1 style="font-size:22px;font-weight:800;margin:0">⚠️ Budget Alert</h1></div>
  <div class="body">
    <p style="font-size:16px;font-weight:600;color:#0F172A">Hi ${name},</p>
    <p style="color:#64748B;margin-top:8px">Your budget <strong>${budgetName}</strong> has reached <strong style="color:${color}">${pct}%</strong></p>
    <div class="progress-bar"><div class="progress-fill"></div></div>
    <p style="color:#64748B">Spent: <strong>${spent}</strong> of <strong>${limit}</strong></p>
    <p style="margin-top:16px;color:#64748B">Open Cashtro to review your spending and adjust if needed.</p>
  </div>
  <div class="footer">© ${new Date().getFullYear()} Cashtro</div>
</div></body></html>`;
    }
    monthlyReportTemplate(name, month, income, expense, savings) {
        return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body { background:#F8FAFC; font-family:-apple-system,sans-serif; }
  .wrapper { max-width:500px; margin:40px auto; background:#fff; border-radius:24px; overflow:hidden; box-shadow:0 8px 40px rgba(0,0,0,.1); }
  .header { background:linear-gradient(135deg,#1E3A8A,#2563EB); padding:32px; text-align:center; color:#fff; }
  .body { padding:32px; }
  .stat { display:flex; justify-content:space-between; padding:14px 0; border-bottom:1px solid #F1F5F9; }
  .footer { padding:20px 32px; text-align:center; font-size:12px; color:#94A3B8; border-top:1px solid #E2E8F0; }
</style></head>
<body><div class="wrapper">
  <div class="header"><h1 style="font-size:22px;font-weight:800;margin:0">📊 Monthly Report</h1><p style="margin:8px 0 0;opacity:.8">${month}</p></div>
  <div class="body">
    <p style="font-size:16px;font-weight:600;color:#0F172A">Hi ${name}, here's your summary for ${month}:</p>
    <div style="margin-top:20px">
      <div class="stat"><span style="color:#64748B">💰 Total Income</span><strong style="color:#10B981">${income}</strong></div>
      <div class="stat"><span style="color:#64748B">💸 Total Expense</span><strong style="color:#EF4444">${expense}</strong></div>
      <div class="stat"><span style="color:#64748B">🏦 Net Savings</span><strong style="color:#2563EB">${savings}</strong></div>
    </div>
    <p style="margin-top:20px;color:#64748B">Open Cashtro to see the full breakdown with categories and trends.</p>
  </div>
  <div class="footer">© ${new Date().getFullYear()} Cashtro</div>
</div></body></html>`;
    }
    async sendCashbookInvite(toEmail, inviterName, bookName, inviteLink) {
        const transporter = await this.getTransporter();
        const from = await this.getFrom();
        await transporter.sendMail({
            from,
            to: toEmail,
            subject: `${inviterName} invited you to join a Cashtro cashbook`,
            html: `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body { background:#F8FAFC; font-family:-apple-system,sans-serif; margin:0; padding:0; }
  .wrapper { max-width:520px; margin:40px auto; background:#fff; border-radius:24px; overflow:hidden; box-shadow:0 8px 40px rgba(0,0,0,.1); border: 1px solid #E2E8F0; }
  .header { background:linear-gradient(135deg,#1E3A8A,#2563EB); padding:36px 32px; text-align:center; color:#fff; }
  .body { padding:32px; background:#fff; }
  .btn { display:inline-block; background:#2563EB; color:#ffffff !important; text-decoration:none; padding:16px 32px; border-radius:12px; font-weight:700; font-size:16px; margin-top:24px; box-shadow: 0 4px 14px rgba(37,99,235,0.4); }
  .footer { padding:20px 32px; text-align:center; font-size:12px; color:#64748B; border-top:1px solid #E2E8F0; background:#F8FAFC; }
</style></head>
<body><div class="wrapper">
  <div class="header">
    <h1 style="font-size:26px;font-weight:800;margin:0;color:#fff;">📒 You're Invited!</h1>
    <p style="margin:10px 0 0;opacity:.9;font-size:16px;color:#fff;">Join a shared cashbook on Cashtro</p>
  </div>
  <div class="body">
    <p style="font-size:16px;color:#1E293B;margin:0 0 12px;line-height:1.5;"><strong>${inviterName}</strong> has invited you to collaborate on their cashbook <strong>"${bookName}"</strong>.</p>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin-bottom:8px;">Tap the button below to accept the invite and start tracking shared expenses together. The link will automatically open in the Cashtro app.</p>
    <div style="text-align:center; margin-bottom: 12px;">
      <a href="${inviteLink}" class="btn">Accept Invite</a>
    </div>
  </div>
  <div class="footer">© ${new Date().getFullYear()} Cashtro · You received this because someone invited you</div>
</div></body></html>`,
        });
    }
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], MailService);
//# sourceMappingURL=mail.service.js.map