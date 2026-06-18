import { CurrencyService } from './currency.service';
declare class ConvertDto {
    amount: number;
    from: string;
    to: string;
}
export declare class CurrencyController {
    private readonly currencyService;
    constructor(currencyService: CurrencyService);
    getSupportedCurrencies(): {
        code: string;
        name: string;
        symbol: string;
    }[];
    getRates(): Promise<Record<string, number>>;
    convert(dto: ConvertDto): Promise<{
        from: string;
        to: string;
        amount: number;
        converted: number;
    }>;
}
export {};
