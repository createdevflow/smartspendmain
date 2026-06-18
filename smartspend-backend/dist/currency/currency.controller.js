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
exports.CurrencyController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const currency_service_1 = require("./currency.service");
const class_validator_1 = require("class-validator");
const public_decorator_1 = require("../common/decorators/public.decorator");
class ConvertDto {
}
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ConvertDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConvertDto.prototype, "from", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConvertDto.prototype, "to", void 0);
let CurrencyController = class CurrencyController {
    constructor(currencyService) {
        this.currencyService = currencyService;
    }
    getSupportedCurrencies() {
        return this.currencyService.getSupportedCurrencies();
    }
    getRates() {
        return this.currencyService.getAllRatesMap();
    }
    async convert(dto) {
        const result = await this.currencyService.convert(dto.amount, dto.from, dto.to);
        return { from: dto.from, to: dto.to, amount: dto.amount, converted: result };
    }
};
exports.CurrencyController = CurrencyController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('supported'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all supported currencies (public)' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CurrencyController.prototype, "getSupportedCurrencies", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Get)('rates'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all exchange rates (EUR base)' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CurrencyController.prototype, "getRates", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Post)('convert'),
    (0, swagger_1.ApiOperation)({ summary: 'Convert amount between currencies' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ConvertDto]),
    __metadata("design:returntype", Promise)
], CurrencyController.prototype, "convert", null);
exports.CurrencyController = CurrencyController = __decorate([
    (0, swagger_1.ApiTags)('currency'),
    (0, common_1.Controller)({ path: 'currency', version: '1' }),
    __metadata("design:paramtypes", [currency_service_1.CurrencyService])
], CurrencyController);
//# sourceMappingURL=currency.controller.js.map