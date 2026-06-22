import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  // Cache transporter for 60s to avoid DB hit on every email
  private cachedTransporter: Transporter | null = null;
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

    const host     = db['smtp_host']   || this.config.get<string>('mail.host')    || '';
    const port     = parseInt(db['smtp_port']   || String(this.config.get<number>('mail.port')   ?? 587), 10);
    const secure   = (db['smtp_secure'] ?? String(this.config.get<boolean>('mail.secure') ?? false)) === 'true';
    const user     = db['smtp_user']   || this.config.get<string>('mail.user')    || '';
    const pass     = db['smtp_pass']   || this.config.get<string>('mail.pass')    || '';

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
    this.cacheExpiresAt = 0;
  }

  // ── From address ──────────────────────────────────────────────────────────

  private async getFrom(): Promise<string> {
    const rows = await this.prisma.appConfig.findMany({
      where: { key: { in: ['mail_from_name', 'mail_from_address'] } },
    });
    const db: Record<string, string> = {};
    for (const row of rows) db[row.key] = row.value;

    const name = db['mail_from_name']    || this.config.get<string>('mail.fromName')    || 'Cashtro';
    const addr = db['mail_from_address'] || this.config.get<string>('mail.fromAddress') || '';
    return `"${name}" <${addr}>`;
  }

  // ── OTP Email ─────────────────────────────────────────────────────────────

  async sendOtp(email: string, name: string, otp: string, purpose: 'email_verify' | 'password_reset') {
    const isVerify = purpose === 'email_verify';

    if (this.config.get('NODE_ENV') === 'development') {
      this.logger.log(`[DEV MODE] ✉️ Email to ${email} | OTP: ${otp}`);
      return;
    }

    try {
      const transporter = await this.getTransporter();
      const from        = await this.getFrom();
      await transporter.sendMail({
        from,
        to: email,
        subject: isVerify ? '✉️ Verify your Cashtro account' : '🔑 Reset your Cashtro password',
        html: this.otpTemplate(name, otp, isVerify),
      });
      this.logger.log(`OTP email sent to ${email} (purpose: ${purpose})`);
    } catch (e) {
      this.logger.error(`Failed to send OTP email to ${email}:`, e);
      throw e; // re-throw so caller can surface the error
    }
  }

  // ── Test Email ────────────────────────────────────────────────────────────

  async sendTestEmail(toEmail: string) {
    const transporter = await this.getTransporter();
    const from        = await this.getFrom();
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

  // ── Budget Alert ──────────────────────────────────────────────────────────

  async sendBudgetAlert(email: string, name: string, budgetName: string, percentage: number, spent: string, limit: string) {
    const transporter = await this.getTransporter();
    const from        = await this.getFrom();
    await transporter.sendMail({
      from,
      to: email,
      subject: `⚠️ Budget Alert: ${budgetName} is ${percentage}% spent`,
      html: this.budgetAlertTemplate(name, budgetName, percentage, spent, limit),
    });
  }

  // ── Monthly Report ────────────────────────────────────────────────────────

  async sendMonthlyReport(email: string, name: string, month: string, income: string, expense: string, savings: string) {
    const transporter = await this.getTransporter();
    const from        = await this.getFrom();
    await transporter.sendMail({
      from,
      to: email,
      subject: `📊 Your Cashtro report for ${month}`,
      html: this.monthlyReportTemplate(name, month, income, expense, savings),
    });
  }

  // ── Templates ─────────────────────────────────────────────────────────────

  private otpTemplate(name: string, otp: string, isVerify: boolean): string {
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
      : "We received a request to reset your password. Use the code below to create a new password. If you didn't request this, please ignore this email."
    }</p>
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

  private budgetAlertTemplate(name: string, budgetName: string, pct: number, spent: string, limit: string): string {
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

  private monthlyReportTemplate(name: string, month: string, income: string, expense: string, savings: string): string {
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
}
