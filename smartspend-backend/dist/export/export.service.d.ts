import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
export declare class ExportService {
    private prisma;
    private crypto;
    constructor(prisma: PrismaService, crypto: CryptoService);
    private assertFeatureEnabled;
    generateTaxReport(userId: string, year: number): Promise<{
        csv: string;
        summary: any;
    }>;
}
