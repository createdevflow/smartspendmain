"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UploadsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const Minio = require("minio");
const features_service_1 = require("../plans/features.service");
let UploadsService = UploadsService_1 = class UploadsService {
    constructor(config, features) {
        this.config = config;
        this.features = features;
        this.logger = new common_1.Logger(UploadsService_1.name);
        this.bucket = this.config.get('minio.bucketReceipts', 'receipts');
        try {
            this.minioClient = new Minio.Client({
                endPoint: this.config.get('minio.endpoint', 'localhost'),
                port: this.config.get('minio.port', 9000),
                useSSL: this.config.get('minio.useSsl', false),
                accessKey: this.config.get('minio.accessKey', 'minioadmin'),
                secretKey: this.config.get('minio.secretKey', 'minioadmin'),
            });
            this.initBucket();
        }
        catch (e) {
            this.logger.warn('MinIO client initialization failed (expected if config missing)');
        }
    }
    async initBucket() {
        try {
            const exists = await this.minioClient.bucketExists(this.bucket);
            if (!exists) {
                await this.minioClient.makeBucket(this.bucket, 'us-east-1');
            }
        }
        catch (e) {
            this.logger.error('Failed to init MinIO bucket', e);
        }
    }
    async uploadReceipt(userId, file) {
        const canUpload = await this.features.canUse(userId, 'receipt_upload');
        if (!canUpload)
            throw new common_1.ForbiddenException('Receipt uploads require a premium plan');
        const ext = file.originalname.split('.').pop();
        const filename = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        try {
            await this.minioClient.putObject(this.bucket, filename, file.buffer, file.size, {
                'Content-Type': file.mimetype,
            });
            const publicUrl = this.config.get('minio.publicUrl', 'http://localhost:9000');
            return {
                key: filename,
                url: `${publicUrl}/${this.bucket}/${filename}`,
            };
        }
        catch (e) {
            this.logger.error('Upload failed', e);
            return {
                key: filename,
                url: `http://localhost:9000/stub/${filename}`,
            };
        }
    }
};
exports.UploadsService = UploadsService;
exports.UploadsService = UploadsService = UploadsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService, features_service_1.FeaturesService])
], UploadsService);
//# sourceMappingURL=uploads.service.js.map