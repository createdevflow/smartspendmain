import { PrismaService } from '../prisma/prisma.service';
export declare class AppConfigController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getPublicConfig(): Promise<{
        config: Record<string, string | boolean>;
        updatedAt: string;
    }>;
}
