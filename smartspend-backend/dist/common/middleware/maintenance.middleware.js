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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaintenanceMiddleware = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let MaintenanceMiddleware = class MaintenanceMiddleware {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async use(req, res, next) {
        const path = req.path;
        const isExempt = path.includes('/admin') ||
            path.includes('/auth') ||
            path.includes('/app-config/public') ||
            path.includes('/health') ||
            path.includes('/docs');
        if (isExempt) {
            return next();
        }
        try {
            const setting = await this.prisma.systemSetting.findUnique({
                where: { key: 'maintenance_mode' },
            });
            if (setting?.value === 'true') {
                throw new common_1.ServiceUnavailableException({
                    statusCode: 503,
                    error: 'Service Unavailable',
                    message: 'The application is currently undergoing maintenance. Please try again shortly.',
                    maintenanceMode: true,
                });
            }
        }
        catch (err) {
            if (err instanceof common_1.ServiceUnavailableException)
                throw err;
        }
        next();
    }
};
exports.MaintenanceMiddleware = MaintenanceMiddleware;
exports.MaintenanceMiddleware = MaintenanceMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MaintenanceMiddleware);
//# sourceMappingURL=maintenance.middleware.js.map