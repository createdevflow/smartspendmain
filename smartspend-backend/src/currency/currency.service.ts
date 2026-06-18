import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';

const SUPPORTED_CURRENCIES = [
  'AUD','BGN','BRL','CAD','CHF','CNY','CZK','DKK','EUR','GBP',
  'HKD','HUF','IDR','ILS','INR','ISK','JPY','KRW','MXN','MYR',
  'NOK','NZD','PHP','PLN','RON','SEK','SGD','THB','TRY','USD','ZAR','AED','SAR',
];

const CURRENCY_NAMES: Record<string, string> = {
  INR: 'Indian Rupee', USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound',
  AUD: 'Australian Dollar', CAD: 'Canadian Dollar', SGD: 'Singapore Dollar',
  AED: 'UAE Dirham', SAR: 'Saudi Riyal', JPY: 'Japanese Yen',
  CHF: 'Swiss Franc', HKD: 'Hong Kong Dollar', CNY: 'Chinese Yuan',
  KRW: 'South Korean Won', MXN: 'Mexican Peso', BRL: 'Brazilian Real',
  ZAR: 'South African Rand', THB: 'Thai Baht', MYR: 'Malaysian Ringgit',
  IDR: 'Indonesian Rupiah', PHP: 'Philippine Peso', NZD: 'New Zealand Dollar',
  SEK: 'Swedish Krona', NOK: 'Norwegian Krone', DKK: 'Danish Krone',
  PLN: 'Polish Zloty', TRY: 'Turkish Lira', ILS: 'Israeli Shekel',
  CZK: 'Czech Koruna', HUF: 'Hungarian Forint', RON: 'Romanian Leu',
  BGN: 'Bulgarian Lev', ISK: 'Icelandic Krona',
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥', AUD: 'A$',
  CAD: 'C$', CHF: 'CHF', CNY: '¥', HKD: 'HK$', SGD: 'S$',
  KRW: '₩', MXN: 'MX$', BRL: 'R$', ZAR: 'R', AED: 'د.إ', SAR: '﷼',
};

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);
  private readonly apiBase: string;

  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
    private config: ConfigService,
    private http: HttpService,
  ) {
    this.apiBase = config.get<string>('currency.apiBase', 'https://api.frankfurter.app');
  }

  /**
   * Fetch latest rates from frankfurter.app (ECB data, free, no API key)
   * and store in DB + Redis cache. Called daily by scheduler.
   */
  async refreshRates(): Promise<void> {
    try {
      const { data } = await this.http.axiosRef.get(`${this.apiBase}/latest`, {
        timeout: 10000,
      });
      // data: { base: "EUR", date: "2025-06-09", rates: { USD: 1.08, INR: 89.5, ... } }
      const { rates } = data;

      const upserts = Object.entries(rates).map(([target, rate]) =>
        this.prisma.exchangeRate.upsert({
          where: { base_target: { base: 'EUR', target } },
          create: { base: 'EUR', target, rate: rate as number },
          update: { rate: rate as number, fetchedAt: new Date() },
        })
      );
      await this.prisma.$transaction(upserts);
      await this.cache.del('currency:rates:map');
      this.logger.log(`Exchange rates updated: ${Object.keys(rates).length} currencies`);
    } catch (err) {
      this.logger.error('Failed to refresh exchange rates:', err.message);
    }
  }

  /**
   * Convert amount from one currency to another.
   * All conversions go through EUR (Frankfurter base).
   */
  async convert(amount: number, from: string, to: string): Promise<number> {
    if (from === to) return amount;
    const rates = await this.getAllRatesMap();
    const fromRate = from === 'EUR' ? 1 : (rates[from] ?? null);
    const toRate   = to   === 'EUR' ? 1 : (rates[to]   ?? null);

    if (!fromRate || !toRate) {
      this.logger.warn(`Exchange rate not found for ${from} or ${to}. Using 1:1.`);
      return amount;
    }
    // amount in from → EUR → to
    return (amount / fromRate) * toRate;
  }

  /**
   * Get all exchange rates as a map { USD: 1.08, INR: 89.5, ... } (EUR base)
   * Redis-cached for 6 hours
   */
  async getAllRatesMap(): Promise<Record<string, number>> {
    const cached = await this.cache.get<Record<string, number>>('currency:rates:map');
    if (cached) return cached;

    const rates = await this.prisma.exchangeRate.findMany();
    const map: Record<string, number> = {};
    for (const r of rates) map[r.target] = Number(r.rate);

    await this.cache.set('currency:rates:map', map, 3600 * 6);
    return map;
  }

  /** Get supported currencies with names and symbols */
  getSupportedCurrencies() {
    return SUPPORTED_CURRENCIES.map(code => ({
      code,
      name: CURRENCY_NAMES[code] || code,
      symbol: CURRENCY_SYMBOLS[code] || code,
    }));
  }

  /** Format currency amount with proper symbol and locale */
  format(amount: number, currency: string, locale = 'en-IN'): string {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency', currency, minimumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${CURRENCY_SYMBOLS[currency] || currency}${amount.toFixed(2)}`;
    }
  }
}
