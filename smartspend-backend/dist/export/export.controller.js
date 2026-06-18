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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const export_service_1 = require("./export.service");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let ExportController = class ExportController {
    constructor(exportService) {
        this.exportService = exportService;
    }
    async taxReport(user, year, res) {
        const targetYear = parseInt(year) || new Date().getFullYear();
        const { csv, summary } = await this.exportService.generateTaxReport(user.sub, targetYear);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="smartspend_tax_report_${targetYear}.csv"`);
        res.setHeader('X-Summary', JSON.stringify(summary));
        res.send(csv);
    }
    async taxReportPreview(user, year) {
        const targetYear = parseInt(year) || new Date().getFullYear();
        return this.exportService.generateTaxReport(user.sub, targetYear);
    }
};
exports.ExportController = ExportController;
__decorate([
    (0, common_1.Get)('tax-report'),
    (0, swagger_1.ApiOperation)({ summary: 'Export TAX_DEDUCTIBLE transactions as CSV for a given year' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('year')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "taxReport", null);
__decorate([
    (0, common_1.Get)('tax-report/preview'),
    (0, swagger_1.ApiOperation)({ summary: 'Preview tax report summary (JSON, no file download)' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "taxReportPreview", null);
exports.ExportController = ExportController = __decorate([
    (0, swagger_1.ApiTags)('export'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Controller)({ path: 'export', version: '1' }),
    __metadata("design:paramtypes", [export_service_1.ExportService])
], ExportController);
//# sourceMappingURL=export.controller.js.map