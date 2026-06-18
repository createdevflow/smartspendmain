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
exports.PassbookController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const passbook_service_1 = require("./passbook.service");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let PassbookController = class PassbookController {
    constructor(passbookService) {
        this.passbookService = passbookService;
    }
    async generatePdf(user, cashbookId, month, res) {
        const buffer = await this.passbookService.generatePdf(user.sub, cashbookId, month);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=passbook-${month}.pdf`,
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }
    async exportCsv(user, cashbookId, month, res) {
        const csv = await this.passbookService.generateCsv(user.sub, cashbookId, month);
        res.set({
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename=transactions-${month}.csv`,
        });
        res.send(csv);
    }
};
exports.PassbookController = PassbookController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Generate passbook PDF' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('cashbookId')),
    __param(2, (0, common_1.Query)('month')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], PassbookController.prototype, "generatePdf", null);
__decorate([
    (0, common_1.Get)('csv'),
    (0, swagger_1.ApiOperation)({ summary: 'Export transactions to CSV' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('cashbookId')),
    __param(2, (0, common_1.Query)('month')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], PassbookController.prototype, "exportCsv", null);
exports.PassbookController = PassbookController = __decorate([
    (0, swagger_1.ApiTags)('passbook'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Controller)({ path: 'passbook', version: '1' }),
    __metadata("design:paramtypes", [passbook_service_1.PassbookService])
], PassbookController);
//# sourceMappingURL=passbook.controller.js.map