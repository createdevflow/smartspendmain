import { PrismaService } from '../prisma/prisma.service';
import { CurrencyService } from '../currency/currency.service';
export declare class SchedulerService {
    private prisma;
    private currency;
    private readonly logger;
    constructor(prisma: PrismaService, currency: CurrencyService);
    refreshExchangeRates(): Promise<void>;
    cleanupExpiredSessions(): Promise<void>;
    cleanupExpiredOtps(): Promise<void>;
}
