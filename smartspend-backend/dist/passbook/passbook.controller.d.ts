import { PassbookService } from './passbook.service';
import { Response } from 'express';
export declare class PassbookController {
    private readonly passbookService;
    constructor(passbookService: PassbookService);
    generatePdf(user: any, cashbookId: string, month: string, res: Response): Promise<void>;
    exportCsv(user: any, cashbookId: string, month: string, res: Response): Promise<void>;
}
