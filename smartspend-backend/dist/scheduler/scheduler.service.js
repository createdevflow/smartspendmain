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
var SchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const currency_service_1 = require("../currency/currency.service");
let SchedulerService = SchedulerService_1 = class SchedulerService {
    constructor(prisma, currency) {
        this.prisma = prisma;
        this.currency = currency;
        this.logger = new common_1.Logger(SchedulerService_1.name);
    }
    async refreshExchangeRates() {
        this.logger.log('Running scheduled task: refreshExchangeRates');
        await this.currency.refreshRates();
    }
    async cleanupExpiredSessions() {
        this.logger.log('Running scheduled task: cleanupExpiredSessions');
        const result = await this.prisma.session.deleteMany({
            where: { OR: [{ isValid: false }, { expiresAt: { lt: new Date() } }] },
        });
        this.logger.log(`Cleaned up ${result.count} expired/invalid sessions`);
    }
    async cleanupExpiredOtps() {
        this.logger.log('Running scheduled task: cleanupExpiredOtps');
        const result = await this.prisma.otpToken.deleteMany({
            where: { expiresAt: { lt: new Date() } },
        });
        this.logger.log(`Cleaned up ${result.count} expired OTPs`);
    }
};
exports.SchedulerService = SchedulerService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_6AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SchedulerService.prototype, "refreshExchangeRates", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SchedulerService.prototype, "cleanupExpiredSessions", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_2AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SchedulerService.prototype, "cleanupExpiredOtps", null);
exports.SchedulerService = SchedulerService = SchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        currency_service_1.CurrencyService])
], SchedulerService);
//# sourceMappingURL=scheduler.service.js.map