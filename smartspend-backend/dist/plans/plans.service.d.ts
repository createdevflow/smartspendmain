import { PrismaService } from '../prisma/prisma.service';
import { FeaturesService } from './features.service';
export declare class PlansService {
    private prisma;
    private features;
    constructor(prisma: PrismaService, features: FeaturesService);
    findAll(): Promise<({
        features: ({
            feature: {
                category: string | null;
                type: string;
                name: string;
                id: string;
                key: string;
                sortOrder: number;
                unit: string | null;
            };
        } & {
            id: string;
            value: string;
            planId: string;
            featureId: string;
        })[];
    } & {
        name: string;
        id: string;
        description: string | null;
        updatedAt: Date;
        createdAt: Date;
        slug: string;
        tagline: string | null;
        color: string;
        isActive: boolean;
        isDefault: boolean;
        priceMonthly: number;
        priceYearly: number;
        sortOrder: number;
    })[]>;
    findBySlug(slug: string): Promise<{
        features: ({
            feature: {
                category: string | null;
                type: string;
                name: string;
                id: string;
                key: string;
                description: string | null;
                updatedAt: Date;
                createdAt: Date;
                sortOrder: number;
                defaultValue: string;
                unit: string | null;
                isVisible: boolean;
            };
        } & {
            id: string;
            value: string;
            planId: string;
            featureId: string;
        })[];
    } & {
        name: string;
        id: string;
        description: string | null;
        updatedAt: Date;
        createdAt: Date;
        slug: string;
        tagline: string | null;
        color: string;
        isActive: boolean;
        isDefault: boolean;
        priceMonthly: number;
        priceYearly: number;
        sortOrder: number;
    }>;
    getUserPlan(userId: string): Promise<{
        plan: ({
            features: ({
                feature: {
                    category: string | null;
                    type: string;
                    name: string;
                    id: string;
                    key: string;
                    description: string | null;
                    updatedAt: Date;
                    createdAt: Date;
                    sortOrder: number;
                    defaultValue: string;
                    unit: string | null;
                    isVisible: boolean;
                };
            } & {
                id: string;
                value: string;
                planId: string;
                featureId: string;
            })[];
        } & {
            name: string;
            id: string;
            description: string | null;
            updatedAt: Date;
            createdAt: Date;
            slug: string;
            tagline: string | null;
            color: string;
            isActive: boolean;
            isDefault: boolean;
            priceMonthly: number;
            priceYearly: number;
            sortOrder: number;
        }) | null;
        features: Record<string, string>;
        usage: {
            cashbooks: {
                current: number;
                limit: string;
            };
            transactionsThisMonth: {
                current: number;
                limit: string;
            };
        };
    }>;
    subscribeToPlan(userId: string, planId: string): Promise<{
        message: string;
        plan: {
            name: string;
            id: string;
            description: string | null;
            updatedAt: Date;
            createdAt: Date;
            slug: string;
            tagline: string | null;
            color: string;
            isActive: boolean;
            isDefault: boolean;
            priceMonthly: number;
            priceYearly: number;
            sortOrder: number;
        };
    }>;
}
