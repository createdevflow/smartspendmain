import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
export declare class CurrencyService {
    private prisma;
    private cache;
    private config;
    private http;
    private readonly logger;
    private readonly apiBase;
    constructor(prisma: PrismaService, cache: CacheService, config: ConfigService, http: HttpService);
    refreshRates(): Promise<void>;
    convert(amount: number, from: string, to: string): Promise<number>;
    getAllRatesMap(): Promise<Record<string, number>>;
    getSupportedCurrencies(): {
        code: string;
        name: string;
        symbol: string;
    }[];
    format(amount: number, currency: string, locale?: string): string;
}
