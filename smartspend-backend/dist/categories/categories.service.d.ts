import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
export declare class CategoriesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string, type?: string): Promise<({
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
    create(userId: string, dto: CreateCategoryDto): Promise<{
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
    update(userId: string, id: string, dto: UpdateCategoryDto): Promise<{
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
    remove(userId: string, id: string): Promise<{
        message: string;
    }>;
}
