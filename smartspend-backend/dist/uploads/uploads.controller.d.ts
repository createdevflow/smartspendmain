import { UploadsService } from './uploads.service';
export declare class UploadsController {
    private readonly uploadsService;
    constructor(uploadsService: UploadsService);
    uploadReceipt(user: any, file: Express.Multer.File): Promise<{
        key: string;
        url: string;
    }>;
}
