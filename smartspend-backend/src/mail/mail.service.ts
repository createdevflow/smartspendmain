import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';

// ── Shared brand helpers ─────────────────────────────────────────────────────

const YEAR = new Date().getFullYear();

/** Cashtro Email Standards BASE CSS */
const BASE_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #FFFFFF; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  .wrapper { max-width: 600px; margin: 40px auto; background: #FFFFFF; overflow: hidden; }
  .header { background: #FFFFFF; padding: 28px; text-align: center; border-bottom: 3px solid #2D8CFF; }
  .header img.logo { height: 32px; margin-bottom: 12px; }
  .header-title { font-size: 20px; font-weight: 700; color: #232333; }
  .body { padding: 28px; background: #F8FAFC; border: 1px solid #E5E7EB; border-radius: 12px; margin: 16px; color: #232333; font-size: 16px; line-height: 1.6; }
  .btn { display: inline-block; background: #2D8CFF; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin-top: 16px; }
  .footer { padding: 24px; text-align: center; font-size: 12px; color: #64748B; line-height: 1.6; }
  .footer a { color: #2D8CFF; text-decoration: none; }
  .confidentiality { font-size: 10px; margin-top: 16px; color: #64748B; border-top: 1px solid #E5E7EB; padding-top: 16px; }
`;

function emailShell(headerTitle: string, bodyContent: string, department: string, logoUrl: string = 'http://localhost:3002/cashtro-logo.png') {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>${BASE_CSS}</style></head><body><div class="wrapper">
<div class="header">
  <img src="${logoUrl}" alt="Cashtro" class="logo" onerror="this.style.display='none'" />
  <div class="header-title">${headerTitle}</div>
</div>
<div class="body">${bodyContent}</div>
<div class="footer">
  Need assistance?<br>
  Visit our website:<br>
  <a href="https://cashtro.in">https://cashtro.in</a><br><br>
  If you have any questions, please contact the appropriate department using the official email addresses listed above.<br><br>
  © ${YEAR} Cashtro. All Rights Reserved.
  <div class="confidentiality">
    This email and any attachments may contain confidential and privileged information intended solely for the named recipient(s). If you have received this communication in error, please notify the sender immediately and permanently delete it. Any unauthorized review, use, disclosure, copying, or distribution is strictly prohibited.
  </div>
</div>
</div></body></html>`;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  // Cache transporter for 60s to avoid DB hit on every email
  private cachedTransporter: Transporter | null = null;
  private cachedDepartments: any[] | null = null;
  private cachedBrandLogoUrl: string | null = null;
  private cacheExpiresAt = 0;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  // ── Dynamic transporter ────────────────────────────────────────────────────

  private async getTransporter(): Promise<Transporter> {
    const now = Date.now();
    if (this.cachedTransporter && now < this.cacheExpiresAt) {
      return this.cachedTransporter;
    }

    // Read SMTP settings from DB (AppConfig table)
    const keys = ['smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_pass'];
    const rows = await this.prisma.appConfig.findMany({
      where: { key: { in: keys } },
    });

    const db: Record<string, string> = {};
    for (const row of rows) db[row.key] = row.value;

    const host     = db['smtp_host']   || this.config.get<string>('SMTP_HOST')    || '';
    const port     = parseInt(db['smtp_port']   || String(this.config.get<number>('SMTP_PORT')   ?? 587), 10);
    const secure   = (db['smtp_secure'] ?? String(this.config.get<boolean>('SMTP_SECURE') ?? false)) === 'true';
    const user     = db['smtp_user']   || this.config.get<string>('SMTP_USER')    || '';
    const pass     = db['smtp_pass']   || this.config.get<string>('SMTP_PASS')    || '';

    this.cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
      tls: { rejectUnauthorized: false },
    });

    this.cacheExpiresAt = now + 60_000; // 60 seconds
    return this.cachedTransporter;
  }

  /** Call this after saving new SMTP settings to force a transporter refresh. */
  invalidateCache() {
    this.cachedTransporter = null;
    this.cachedDepartments = null;
    this.cachedBrandLogoUrl = null;
    this.cacheExpiresAt = 0;
  }

  // ── Departments Cache ──────────────────────────────────────────────────────

  private getDefaultDepartments() {
    return [
      { id: 'noreply', name: 'Cashtro', email: 'noreply@cashtro.in', signature: `<p style="margin-top:24px;color:#64748B;font-size:14px;">Thank you,<br><strong style="color:#232333">Cashtro</strong><br>Automated Notification<br>Please do not reply to this email.<br>🌐 <a href="https://cashtro.in">https://cashtro.in</a></p>` },
      { id: 'admin', name: 'Cashtro Administration', email: 'admin@cashtro.in', signature: `<p style="margin-top:24px;color:#64748B;font-size:14px;">Regards,<br><strong style="color:#232333">Cashtro Administration</strong><br>Internal Operations<br>🌐 <a href="https://cashtro.in">https://cashtro.in</a><br>📧 admin@cashtro.in</p>` },
      { id: 'support', name: 'Cashtro Support', email: 'support@cashtro.in', signature: `<p style="margin-top:24px;color:#64748B;font-size:14px;">Here to help,<br><strong style="color:#232333">Cashtro Support Team</strong><br>🌐 <a href="https://cashtro.in">https://cashtro.in</a><br>📧 support@cashtro.in</p>` },
      { id: 'billing', name: 'Cashtro Billing', email: 'billing@cashtro.in', signature: `<p style="margin-top:24px;color:#64748B;font-size:14px;">Regards,<br><strong style="color:#232333">Cashtro Billing Team</strong><br>🌐 <a href="https://cashtro.in">https://cashtro.in</a><br>📧 billing@cashtro.in</p>` },
      { id: 'legal', name: 'Cashtro Legal', email: 'legal@cashtro.in', signature: `<p style="margin-top:24px;color:#64748B;font-size:14px;">Regards,<br><strong style="color:#232333">Cashtro Legal & Compliance</strong><br>🌐 <a href="https://cashtro.in">https://cashtro.in</a><br>📧 legal@cashtro.in</p>` }
    ];
  }

  private async getDepartments(): Promise<any[]> {
    const now = Date.now();
    if (this.cachedDepartments && now < this.cacheExpiresAt) {
      return this.cachedDepartments;
    }

    const row = await this.prisma.appConfig.findUnique({ where: { key: 'email_departments' } });
    if (row && row.value) {
      try {
        this.cachedDepartments = JSON.parse(row.value);
      } catch (e) {
        this.cachedDepartments = this.getDefaultDepartments();
      }
    } else {
      this.cachedDepartments = this.getDefaultDepartments();
    }
    return this.cachedDepartments || [];
  }

  private async getBrandLogoUrl(): Promise<string> {
    const now = Date.now();
    if (this.cachedBrandLogoUrl !== null && now < this.cacheExpiresAt) {
      return this.cachedBrandLogoUrl;
    }
    const row = await this.prisma.appConfig.findUnique({ where: { key: 'brand_logo_url' } });
    let logoUrl = row?.value || 'https://cashtro.in/cashtro-logo.png';
    if (process.env.NODE_ENV !== 'production' && logoUrl.includes('cashtro.in')) {
      logoUrl = `${process.env.APP_URL?.replace('3010', '3002') || 'http://localhost:3002'}/cashtro-logo.png`;
    }
    this.cachedBrandLogoUrl = logoUrl;
    return this.cachedBrandLogoUrl;
  }

  // ── From address ──────────────────────────────────────────────────────────

  private async getFrom(departmentId: string = 'noreply'): Promise<string> {
    const deps = await this.getDepartments();
    const dep = deps.find(d => d.id === departmentId) || deps[0];
    return `"${dep.name}" <${dep.email}>`;
  }

  private async signatureBlock(departmentId: string): Promise<string> {
    const deps = await this.getDepartments();
    const dep = deps.find(d => d.id === departmentId) || deps[0];
    return dep.signature;
  }

  // ── OTP Email ─────────────────────────────────────────────────────────────

  async sendOtp(email: string, name: string, otp: string, purpose: 'email_verify' | 'password_reset') {
    const isVerify = purpose === 'email_verify';

    // Check if SMTP is actively configured in DB or env
    const hostRow = await this.prisma.appConfig.findFirst({ where: { key: 'smtp_host' } });
    const host = hostRow?.value || this.config.get<string>('SMTP_HOST');

    if (!host) {
      this.logger.log(`[LOCAL DEV - No SMTP Configured] ✉️ Email to ${email} | OTP: ${otp}`);
      return;
    }

    try {
      const transporter = await this.getTransporter();
      const from        = await this.getFrom('noreply');
      const html        = await this.otpTemplate(name, otp, isVerify, email);
      await transporter.sendMail({
        from,
        to: email,
        subject: isVerify ? '✉️ Verify your Cashtro account' : '🔑 Reset your Cashtro password',
        html,
      });
      this.logger.log(`OTP email sent to ${email} (purpose: ${purpose})`);
    } catch (e) {
      this.logger.error(`Failed to send OTP email to ${email}:`, e);
      throw e;
    }
  }

  // ── Test Email ────────────────────────────────────────────────────────────

  async sendTestEmail(toEmail: string) {
    const transporter = await this.getTransporter();
    const from        = await this.getFrom('admin');
    const signature   = await this.signatureBlock('admin');
    const logoUrl     = await this.getBrandLogoUrl();
    await transporter.sendMail({
      from,
      to: toEmail,
      subject: '✅ Cashtro SMTP Test — Configuration Working',
      html: emailShell(
        'Server Notification',
        `<p style="font-size:16px;font-weight:700;color:#232333;margin-bottom:12px">✅ Email Delivery Confirmed!</p>
         <div style="display:inline-block;background:#F0FDF4;color:#16A34A;border:1px solid #16A34A;padding:8px 20px;border-radius:999px;font-weight:700;font-size:14px;margin:12px 0">
           ✓ Test email delivered successfully
         </div>
         <p style="color:#64748B;margin-top:16px;font-size:14px;line-height:1.6">
           Your SMTP configuration is working correctly. All transactional emails (OTP verification, password reset, budget alerts) will be delivered to your users.
         </p>
         ${signature}`,
        'admin',
        logoUrl
      ),
    });
  }

  // ── Budget Alert ──────────────────────────────────────────────────────────

  async sendBudgetAlert(email: string, name: string, budgetName: string, percentage: number, spent: string, limit: string) {
    const transporter = await this.getTransporter();
    const from        = await this.getFrom('noreply');
    const html        = await this.budgetAlertTemplate(name, budgetName, percentage, spent, limit);
    await transporter.sendMail({
      from,
      to: email,
      subject: `⚠️ Budget Alert: ${budgetName} is ${percentage}% spent`,
      html,
    });
  }

  // ── Monthly Report ────────────────────────────────────────────────────────

  async sendMonthlyReport(email: string, name: string, month: string, income: string, expense: string, savings: string) {
    const transporter = await this.getTransporter();
    const from        = await this.getFrom('noreply');
    const html        = await this.monthlyReportTemplate(name, month, income, expense, savings);
    await transporter.sendMail({
      from,
      to: email,
      subject: `📊 Your Cashtro report for ${month}`,
      html,
    });
  }

  // ── Cashbook Invite Email ──────────────────────────────────────────────────

  async sendCashbookInvite(toEmail: string, inviterName: string, bookName: string, inviteLink: string) {
    const transporter = await this.getTransporter();
    const from = await this.getFrom('noreply');
    const signature = await this.signatureBlock('noreply');
    const logoUrl = await this.getBrandLogoUrl();
    await transporter.sendMail({
      from,
      to: toEmail,
      subject: `${inviterName} invited you to join a Cashtro cashbook`,
      html: emailShell(
        `You're Invited!`,
        `<p style="font-size:16px;color:#232333;margin-bottom:12px;line-height:1.6">
           <strong>${inviterName}</strong> has invited you to collaborate on their cashbook <strong>"${bookName}"</strong>.
         </p>
         <p style="color:#64748B;font-size:14px;line-height:1.65;margin-bottom:24px">
           Tap the button below to accept the invite and start tracking shared expenses together.
           The link will automatically open in the Cashtro app.
         </p>
         <div style="text-align:center;margin-bottom:8px">
           <a class="btn" href="${inviteLink}">
             Accept Invite →
           </a>
         </div>
         ${signature}`,
        'noreply',
        logoUrl
      ),
    });
  }

  // ── Custom / Scheduled Email ───────────────────────────────────────────────

  async sendCustomEmail(opts: { to: string | string[]; subject: string; html: string; attachments?: any[] }) {
    const transporter = await this.getTransporter();
    const from = await this.getFrom('noreply');
    const recipients = Array.isArray(opts.to) ? opts.to.join(',') : opts.to;
    await transporter.sendMail({ from, to: recipients, subject: opts.subject, html: opts.html, attachments: opts.attachments });
  }

  // ── Templates ─────────────────────────────────────────────────────────────

  private async otpTemplate(name: string, otp: string, isVerify: boolean, email?: string): Promise<string> {
    const signature = await this.signatureBlock('noreply');
    const logoUrl = await this.getBrandLogoUrl();
    return emailShell(
      isVerify ? 'Email Verification' : 'Password Reset',
      `<p style="font-size:16px;font-weight:700;color:#232333;margin-bottom:10px">Hi ${name} 👋</p>
       <p style="font-size:14px;color:#64748B;line-height:1.65;margin-bottom:24px">
         ${isVerify
           ? "Welcome to Cashtro! You're one step away from taking control of your finances. Use the code below to verify your email address."
           : "We received a request to reset your Cashtro password. Click the button below to create a new password. If you didn't request this, please ignore this email."
         }
       </p>
       ${isVerify ? `
       <div style="background:#FFFFFF;border:1px dashed #2D8CFF;border-radius:12px;padding:24px;text-align:center;margin-bottom:20px">
         <div style="font-size:10px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px">Your verification code</div>
         <div style="font-size:38px;font-weight:800;color:#2D8CFF;letter-spacing:10px;font-variant-numeric:tabular-nums">${otp}</div>
       </div>
       <p style="font-size:12px;color:#64748B;text-align:center;margin-bottom:20px">⏱️ This code expires in <strong>10 minutes</strong></p>
       <div style="background:#F8FAFC;border:1px solid #F59E0B;border-radius:8px;padding:12px 16px;font-size:13px;color:#F59E0B;margin-bottom:16px;">
         🔒 <strong>Security tip:</strong> Never share this code with anyone. Cashtro will never ask for your OTP via phone or chat.
       </div>
       ` : ''}
       ${!isVerify && email ? `
       <div style="text-align:center;margin-bottom:32px;padding-top:16px;">
         <a href="${process.env.APP_URL?.replace('3010', '3002') || 'http://localhost:3002'}/reset-password?email=${encodeURIComponent(email)}&otp=${otp}" style="display:inline-block;background:#2D8CFF;color:#FFFFFF;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;">
           Reset Password
         </a>
         <p style="font-size:12px;color:#64748B;text-align:center;margin-top:20px">⏱️ This link expires in <strong>10 minutes</strong></p>
       </div>
       ` : ''}
       ${signature}`,
      'noreply',
      logoUrl
    );
  }

  private async budgetAlertTemplate(name: string, budgetName: string, pct: number, spent: string, limit: string): Promise<string> {
    const color = pct >= 100 ? '#DC2626' : pct >= 80 ? '#F59E0B' : '#2D8CFF';
    const emoji = pct >= 100 ? '🚨' : pct >= 80 ? '⚠️' : '📊';
    const signature = await this.signatureBlock('noreply');
    const logoUrl = await this.getBrandLogoUrl();
    return emailShell(
      `${emoji} Budget Alert`,
      `<p style="font-size:16px;font-weight:700;color:#232333;margin-bottom:8px">Hi ${name},</p>
       <p style="color:#64748B;font-size:14px;margin-bottom:16px">
         Your budget <strong style="color:#232333">${budgetName}</strong> has reached
         <strong style="color:${color}">${pct}%</strong> of its limit.
       </p>
       <div style="background:#FFFFFF;border:1px solid #E5E7EB;border-radius:8px;padding:16px;margin-bottom:16px">
         <div style="background:#E5E7EB;border-radius:999px;height:10px;margin-bottom:12px;overflow:hidden">
           <div style="background:${color};border-radius:999px;height:10px;width:${Math.min(pct, 100)}%"></div>
         </div>
         <table width="100%" cellpadding="0" cellspacing="0">
           <tr>
             <td align="left" style="color:#64748B;font-size:13px">Spent: <strong style="color:#232333">${spent}</strong></td>
             <td align="right" style="color:#64748B;font-size:13px">Limit: <strong style="color:#232333">${limit}</strong></td>
           </tr>
         </table>
       </div>
       <p style="color:#64748B;font-size:14px">Open Cashtro to review your spending and adjust if needed.</p>
       ${signature}`,
      'noreply',
      logoUrl
    );
  }

  private async monthlyReportTemplate(name: string, month: string, income: string, expense: string, savings: string): Promise<string> {
    const signature = await this.signatureBlock('noreply');
    const logoUrl = await this.getBrandLogoUrl();
    return emailShell(
      `Monthly Report: ${month}`,
      `<p style="font-size:16px;font-weight:700;color:#232333;margin-bottom:20px">Hi ${name}, here's your summary for ${month}:</p>
       <table width="100%" cellpadding="0" cellspacing="10">
         <tr>
           <td align="center" style="background:#FFFFFF;border:1px solid #16A34A;border-radius:8px;padding:12px;width:33%;">
             <div style="font-size:10px;font-weight:700;color:#16A34A;text-transform:uppercase;margin-bottom:4px">Income</div>
             <div style="font-size:15px;font-weight:800;color:#16A34A">${income}</div>
           </td>
           <td align="center" style="background:#FFFFFF;border:1px solid #DC2626;border-radius:8px;padding:12px;width:33%;">
             <div style="font-size:10px;font-weight:700;color:#DC2626;text-transform:uppercase;margin-bottom:4px">Expenses</div>
             <div style="font-size:15px;font-weight:800;color:#DC2626">${expense}</div>
           </td>
           <td align="center" style="background:#FFFFFF;border:1px solid #2D8CFF;border-radius:8px;padding:12px;width:33%;">
             <div style="font-size:10px;font-weight:700;color:#2D8CFF;text-transform:uppercase;margin-bottom:4px">Saved</div>
             <div style="font-size:15px;font-weight:800;color:#2D8CFF">${savings}</div>
           </td>
         </tr>
       </table>
       <p style="color:#64748B;font-size:14px;margin-top:20px">Open Cashtro to see the full breakdown with categories and trends.</p>
       ${signature}`,
      'noreply',
      logoUrl
    );
  }
}
