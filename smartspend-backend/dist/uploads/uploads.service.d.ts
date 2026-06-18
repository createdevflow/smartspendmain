import { ConfigService } from '@nestjs/config';
import { FeaturesService } from '../plans/features.service';
export declare class UploadsService {
    private config;
    private features;
    private minioClient;
    private bucket;
    private readonly logger;
    constructor(config: ConfigService, features: FeaturesService);
    private initBucket;
    uploadReceipt(userId: string, file: Express.Multer.File): Promise<{
        key: string;
        url: string;
    }>;
}
