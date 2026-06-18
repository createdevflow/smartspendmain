export declare class CreateCashbookDto {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    currency?: string;
    openingBalance?: number;
}
export declare class UpdateCashbookDto {
    name?: string;
    description?: string;
    color?: string;
    icon?: string;
    isArchived?: boolean;
}
