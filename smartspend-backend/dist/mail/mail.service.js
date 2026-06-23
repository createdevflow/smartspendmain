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
const BRAND_NAVY = '#1E3A8A';
const BRAND_BLUE = '#2563EB';
const YEAR = new Date().getFullYear();
const BASE_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #EFF4FB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  .wrapper { max-width: 480px; margin: 40px auto; background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 40px rgba(30,58,138,.12); }
  .header { background: linear-gradient(135deg, ${BRAND_NAVY} 0%, ${BRAND_BLUE} 100%); padding: 28px; text-align: center; }
  .brand { font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
  .brand-in { font-size: 15px; color: #93C5FD; font-weight: 600; }
  .header-sub { font-size: 11px; color: rgba(255,255,255,0.65); margin-top: 4px; letter-spacing: 1.2px; text-transform: uppercase; }
  .body { padding: 28px; }
  .footer { background: #F8FAFC; padding: 18px 28px; text-align: center; font-size: 11px; color: #94A3B8; border-top: 1px solid #E2E8F0; line-height: 1.8; }
  .footer a { color: ${BRAND_BLUE}; text-decoration: none; }
`;
function emailShell(headerContent, bodyContent, footerContent = '') {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>${BASE_CSS}</style></head><body><div class="wrapper">
<div class="header">${headerContent}</div>
<div class="body">${bodyContent}</div>
<div class="footer">${footerContent || `© ${YEAR} Cashtro · <a href="https://cashtro.in">cashtro.in</a><br>Manage · Track · Grow`}</div>
</div></body></html>`;
}
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
            html: emailShell(`<div class="brand">Cashtro<span class="brand-in">.in</span></div>
         <div class="header-sub">SMTP Configuration Test</div>`, `<p style="font-size:16px;font-weight:700;color:#0F172A;margin-bottom:12px">✅ Email Delivery Confirmed!</p>
         <div style="display:inline-block;background:#DCFCE7;color:#166534;border:1px solid #86EFAC;padding:8px 20px;border-radius:999px;font-weight:700;font-size:14px;margin:12px 0">
           ✓ Test email delivered successfully
         </div>
         <p style="color:#64748B;margin-top:16px;font-size:14px;line-height:1.6">
           Your SMTP configuration is working correctly. All transactional emails (OTP verification, password reset, budget alerts) will be delivered to your users.
         </p>`, `© ${YEAR} Cashtro Admin · <a href="https://cashtro.in">cashtro.in</a>`),
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
        return emailShell(`<div class="brand">Cashtro<span class="brand-in">.in</span></div>
       <div class="header-sub">${isVerify ? 'Email Verification' : 'Password Reset'}</div>`, `<p style="font-size:17px;font-weight:700;color:#0F172A;margin-bottom:10px">Hi ${name} 👋</p>
       <p style="font-size:14px;color:#64748B;line-height:1.65;margin-bottom:24px">
         ${isVerify
            ? "Welcome to Cashtro! You're one step away from taking control of your finances. Use the code below to verify your email address."
            : "We received a request to reset your Cashtro password. Use the code below to create a new password. If you didn't request this, please ignore this email."}
       </p>
       <div style="background:linear-gradient(135deg,#EFF6FF,#DBEAFE);border:1.5px dashed #93C5FD;border-radius:16px;padding:24px;text-align:center;margin-bottom:20px">
         <div style="font-size:10px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px">Your verification code</div>
         <div style="font-size:38px;font-weight:800;color:${BRAND_NAVY};letter-spacing:10px;font-variant-numeric:tabular-nums">${otp}</div>
       </div>
       <p style="font-size:12px;color:#94A3B8;text-align:center;margin-bottom:20px">⏱️ This code expires in <strong>10 minutes</strong></p>
       <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:12px 16px;font-size:13px;color:#92400E">
         🔒 <strong>Security tip:</strong> Never share this code with anyone. Cashtro will never ask for your OTP via phone or chat.
       </div>`, `© ${YEAR} Cashtro · <a href="https://cashtro.in">cashtro.in</a><br>
       Manage · Track · Grow<br>
       If you didn't request this, you can safely ignore this email.`);
    }
    budgetAlertTemplate(name, budgetName, pct, spent, limit) {
        const color = pct >= 100 ? '#EF4444' : pct >= 80 ? '#F59E0B' : BRAND_BLUE;
        const emoji = pct >= 100 ? '🚨' : pct >= 80 ? '⚠️' : '📊';
        return emailShell(`<div style="font-size:32px;margin-bottom:8px">${emoji}</div>
       <div class="brand">Budget Alert</div>
       <div class="header-sub">Cashtro · cashtro.in</div>`, `<p style="font-size:16px;font-weight:700;color:#0F172A;margin-bottom:8px">Hi ${name},</p>
       <p style="color:#64748B;font-size:14px;margin-bottom:16px">
         Your budget <strong style="color:#0F172A">${budgetName}</strong> has reached
         <strong style="color:${color}">${pct}%</strong> of its limit.
       </p>
       <div style="background:#F8FAFC;border-radius:12px;padding:16px;margin-bottom:16px">
         <div style="background:#E2E8F0;border-radius:999px;height:10px;margin-bottom:10px;overflow:hidden">
           <div style="background:${color};border-radius:999px;height:10px;width:${Math.min(pct, 100)}%"></div>
         </div>
         <div style="display:flex;justify-content:space-between;font-size:13px">
           <span style="color:#64748B">Spent: <strong style="color:#0F172A">${spent}</strong></span>
           <span style="color:#64748B">Limit: <strong style="color:#0F172A">${limit}</strong></span>
         </div>
       </div>
       <p style="color:#64748B;font-size:14px">Open Cashtro to review your spending and adjust if needed.</p>`);
    }
    monthlyReportTemplate(name, month, income, expense, savings) {
        return emailShell(`<div style="font-size:28px;margin-bottom:8px">📊</div>
       <div class="brand">Monthly Report</div>
       <div class="header-sub">${month}</div>`, `<p style="font-size:16px;font-weight:700;color:#0F172A;margin-bottom:20px">Hi ${name}, here's your summary for ${month}:</p>
       <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px">
         <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:14px;text-align:center">
           <div style="font-size:10px;font-weight:700;color:#16A34A;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px">Income</div>
           <div style="font-size:16px;font-weight:800;color:#16A34A">${income}</div>
         </div>
         <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;padding:14px;text-align:center">
           <div style="font-size:10px;font-weight:700;color:#DC2626;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px">Expenses</div>
           <div style="font-size:16px;font-weight:800;color:#DC2626">${expense}</div>
         </div>
         <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:14px;text-align:center">
           <div style="font-size:10px;font-weight:700;color:${BRAND_NAVY};text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px">Saved</div>
           <div style="font-size:16px;font-weight:800;color:${BRAND_NAVY}">${savings}</div>
         </div>
       </div>
       <p style="color:#64748B;font-size:14px">Open Cashtro to see the full breakdown with categories and trends.</p>`);
    }
    async sendCashbookInvite(toEmail, inviterName, bookName, inviteLink) {
        const transporter = await this.getTransporter();
        const from = await this.getFrom();
        await transporter.sendMail({
            from,
            to: toEmail,
            subject: `${inviterName} invited you to join a Cashtro cashbook`,
            html: emailShell(`<div style="font-size:32px;margin-bottom:8px">📒</div>
         <div class="brand">You're Invited!</div>
         <div class="header-sub">Join a shared cashbook on Cashtro</div>`, `<p style="font-size:15px;color:#1E293B;margin-bottom:12px;line-height:1.6">
           <strong>${inviterName}</strong> has invited you to collaborate on their cashbook <strong>"${bookName}"</strong>.
         </p>
         <p style="color:#475569;font-size:14px;line-height:1.65;margin-bottom:24px">
           Tap the button below to accept the invite and start tracking shared expenses together.
           The link will automatically open in the Cashtro app.
         </p>
         <div style="text-align:center;margin-bottom:8px">
           <a href="${inviteLink}" style="display:inline-block;background:${BRAND_BLUE};color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px;box-shadow:0 4px 14px rgba(37,99,235,0.35)">
             Accept Invite →
           </a>
         </div>`, `© ${YEAR} Cashtro · You received this because someone invited you<br>
         <a href="https://cashtro.in">cashtro.in</a>`),
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