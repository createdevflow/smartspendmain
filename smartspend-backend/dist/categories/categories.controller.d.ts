import { CategoriesService } from './categories.service';
import { CategorizationService } from './categorization.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { SuggestCategoryDto } from './dto/suggest-category.dto';
export declare class CategoriesController {
    private readonly categoriesService;
    private readonly categorization;
    constructor(categoriesService: CategoriesService, categorization: CategorizationService);
    findAll(user: any, type?: string): Promise<({
        children: {
            type: string;
            name: string;
            id: string;
            createdAt: Date;
            userId: string | null;
            slug: string;
            color: string;
            sortOrder: number;
            emoji: string;
            parentId: string | null;
            isSystem: boolean;
        }[];
    } & {
        type: string;
        name: string;
        id: string;
        createdAt: Date;
        userId: string | null;
        slug: string;
        color: string;
        sortOrder: number;
        emoji: string;
        parentId: string | null;
        isSystem: boolean;
    })[]>;
    create(user: any, dto: CreateCategoryDto): Promise<{
        type: string;
        name: string;
        id: string;
        createdAt: Date;
        userId: string | null;
        slug: string;
        color: string;
        sortOrder: number;
        emoji: string;
        parentId: string | null;
        isSystem: boolean;
    }>;
    update(user: any, id: string, dto: UpdateCategoryDto): Promise<{
        type: string;
        name: string;
        id: string;
        createdAt: Date;
        userId: string | null;
        slug: string;
        color: string;
        sortOrder: number;
        emoji: string;
        parentId: string | null;
        isSystem: boolean;
    }>;
    remove(user: any, id: string): Promise<{
        message: string;
    }>;
    suggest(user: any, dto: SuggestCategoryDto): Promise<{
        name: string;
        id: string;
        color: string;
        emoji: string;
    } | null>;
}
