export declare class CreateCategoryDto {
    name: string;
    emoji: string;
    color: string;
    type: string;
    parentId?: string;
}
export declare class UpdateCategoryDto {
    name?: string;
    emoji?: string;
    color?: string;
}
export declare class SuggestCategoryDto {
    merchant?: string;
    notes?: string;
}
