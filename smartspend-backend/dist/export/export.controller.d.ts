import { Response } from 'express';
import { ExportService } from './export.service';
export declare class ExportController {
    private readonly exportService;
    constructor(exportService: ExportService);
    taxReport(user: any, year: string, res: Response): Promise<void>;
    taxReportPreview(user: any, year: string): Promise<{
        csv: string;
        summary: any;
    }>;
}
