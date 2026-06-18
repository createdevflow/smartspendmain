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
var CurrencyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrencyService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const cache_service_1 = require("../cache/cache.service");
const SUPPORTED_CURRENCIES = [
    'AUD', 'BGN', 'BRL', 'CAD', 'CHF', 'CNY', 'CZK', 'DKK', 'EUR', 'GBP',
    'HKD', 'HUF', 'IDR', 'ILS', 'INR', 'ISK', 'JPY', 'KRW', 'MXN', 'MYR',
    'NOK', 'NZD', 'PHP', 'PLN', 'RON', 'SEK', 'SGD', 'THB', 'TRY', 'USD', 'ZAR', 'AED', 'SAR',
];
const CURRENCY_NAMES = {
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
const CURRENCY_SYMBOLS = {
    INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥', AUD: 'A$',
    CAD: 'C$', CHF: 'CHF', CNY: '¥', HKD: 'HK$', SGD: 'S$',
    KRW: '₩', MXN: 'MX$', BRL: 'R$', ZAR: 'R', AED: 'د.إ', SAR: '﷼',
};
let CurrencyService = CurrencyService_1 = class CurrencyService {
    constructor(prisma, cache, config, http) {
        this.prisma = prisma;
        this.cache = cache;
        this.config = config;
        this.http = http;
        this.logger = new common_1.Logger(CurrencyService_1.name);
        this.apiBase = config.get('currency.apiBase', 'https://api.frankfurter.app');
    }
    async refreshRates() {
        try {
            const { data } = await this.http.axiosRef.get(`${this.apiBase}/latest`, {
                timeout: 10000,
            });
            const { rates } = data;
            const upserts = Object.entries(rates).map(([target, rate]) => this.prisma.exchangeRate.upsert({
                where: { base_target: { base: 'EUR', target } },
                create: { base: 'EUR', target, rate: rate },
                update: { rate: rate, fetchedAt: new Date() },
            }));
            await this.prisma.$transaction(upserts);
            await this.cache.del('currency:rates:map');
            this.logger.log(`Exchange rates updated: ${Object.keys(rates).length} currencies`);
        }
        catch (err) {
            this.logger.error('Failed to refresh exchange rates:', err.message);
        }
    }
    async convert(amount, from, to) {
        if (from === to)
            return amount;
        const rates = await this.getAllRatesMap();
        const fromRate = from === 'EUR' ? 1 : (rates[from] ?? null);
        const toRate = to === 'EUR' ? 1 : (rates[to] ?? null);
        if (!fromRate || !toRate) {
            this.logger.warn(`Exchange rate not found for ${from} or ${to}. Using 1:1.`);
            return amount;
        }
        return (amount / fromRate) * toRate;
    }
    async getAllRatesMap() {
        const cached = await this.cache.get('currency:rates:map');
        if (cached)
            return cached;
        const rates = await this.prisma.exchangeRate.findMany();
        const map = {};
        for (const r of rates)
            map[r.target] = Number(r.rate);
        await this.cache.set('currency:rates:map', map, 3600 * 6);
        return map;
    }
    getSupportedCurrencies() {
        return SUPPORTED_CURRENCIES.map(code => ({
            code,
            name: CURRENCY_NAMES[code] || code,
            symbol: CURRENCY_SYMBOLS[code] || code,
        }));
    }
    format(amount, currency, locale = 'en-IN') {
        try {
            return new Intl.NumberFormat(locale, {
                style: 'currency', currency, minimumFractionDigits: 2,
            }).format(amount);
        }
        catch {
            return `${CURRENCY_SYMBOLS[currency] || currency}${amount.toFixed(2)}`;
        }
    }
};
exports.CurrencyService = CurrencyService;
exports.CurrencyService = CurrencyService = CurrencyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService,
        config_1.ConfigService,
        axios_1.HttpService])
], CurrencyService);
//# sourceMappingURL=currency.service.js.map