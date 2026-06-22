import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class MailService {
    private config;
    private prisma;
    private readonly logger;
    private cachedTransporter;
    private cacheExpiresAt;
    constructor(config: ConfigService, prisma: PrismaService);
    private getTransporter;
    invalidateCache(): void;
    private getFrom;
    sendOtp(email: string, name: string, otp: string, purpose: 'email_verify' | 'password_reset'): Promise<void>;
    sendTestEmail(toEmail: string): Promise<void>;
    sendBudgetAlert(email: string, name: string, budgetName: string, percentage: number, spent: string, limit: string): Promise<void>;
    sendMonthlyReport(email: string, name: string, month: string, income: string, expense: string, savings: string): Promise<void>;
    private otpTemplate;
    private budgetAlertTemplate;
    private monthlyReportTemplate;
    sendCashbookInvite(toEmail: string, inviterName: string, bookName: string, inviteLink: string): Promise<void>;
}
