import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
export declare class PassbookService {
    private prisma;
    private crypto;
    constructor(prisma: PrismaService, crypto: CryptoService);
    generatePdf(userId: string, cashbookId: string, month: string): Promise<Buffer<ArrayBuffer>>;
    generateCsv(userId: string, cashbookId: string, month: string): Promise<string>;
    private getTransactions;
}
