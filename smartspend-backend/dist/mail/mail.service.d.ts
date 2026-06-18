import { ConfigService } from '@nestjs/config';
export declare class MailService {
    private config;
    private transporter;
    constructor(config: ConfigService);
    private get from();
    sendOtp(email: string, name: string, otp: string, purpose: 'email_verify' | 'password_reset'): Promise<void>;
    sendBudgetAlert(email: string, name: string, budgetName: string, percentage: number, spent: string, limit: string): Promise<void>;
    sendMonthlyReport(email: string, name: string, month: string, income: string, expense: string, savings: string): Promise<void>;
    private otpTemplate;
    private budgetAlertTemplate;
    private monthlyReportTemplate;
}
