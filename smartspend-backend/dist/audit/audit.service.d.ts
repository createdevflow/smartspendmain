import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@prisma/client';
interface AuditLogInput {
    userId?: string;
    action: AuditAction;
    entity?: string;
    entityId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
}
export declare class AuditService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    log(input: AuditLogInput): Promise<void>;
}
export {};
