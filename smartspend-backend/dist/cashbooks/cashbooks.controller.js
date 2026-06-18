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
exports.CashbooksController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cashbooks_service_1 = require("./cashbooks.service");
const cashbooks_members_service_1 = require("./cashbooks.members.service");
const create_cashbook_dto_1 = require("./dto/create-cashbook.dto");
const update_cashbook_dto_1 = require("./dto/update-cashbook.dto");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let CashbooksController = class CashbooksController {
    constructor(cashbooksService, membersService) {
        this.cashbooksService = cashbooksService;
        this.membersService = membersService;
    }
    findAll(user, archived) {
        return this.cashbooksService.findAll(user.sub, archived === 'true');
    }
    create(user, dto) {
        return this.cashbooksService.create(user.sub, dto);
    }
    findOne(user, id) {
        return this.cashbooksService.findOne(user.sub, id);
    }
    update(user, id, dto) {
        return this.cashbooksService.update(user.sub, id, dto);
    }
    remove(user, id) {
        return this.cashbooksService.remove(user.sub, id);
    }
    reorder(user, body) {
        return this.cashbooksService.reorder(user.sub, body.orderedIds);
    }
    getMembers(user, id) {
        return this.membersService.getMembers(user.sub, id);
    }
    inviteMember(user, id, body) {
        return this.membersService.inviteMember(user.sub, id, { ...body, role: body.role });
    }
    createInviteLink(user, id) {
        return this.membersService.createInviteLink(user.sub, id);
    }
    removeMember(user, id, memberId) {
        return this.membersService.removeMember(user.sub, id, memberId);
    }
    updateMemberRole(user, id, memberId, body) {
        return this.membersService.updateMemberRole(user.sub, id, memberId, body.role);
    }
    leaveBook(user, id) {
        return this.membersService.leaveBook(user.sub, id);
    }
    acceptInvite(user, token) {
        return this.membersService.acceptInvite(user.sub, token);
    }
};
exports.CashbooksController = CashbooksController;
__decorate([
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('archived')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CashbooksController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_cashbook_dto_1.CreateCashbookDto]),
    __metadata("design:returntype", void 0)
], CashbooksController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CashbooksController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_cashbook_dto_1.UpdateCashbookDto]),
    __metadata("design:returntype", void 0)
], CashbooksController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CashbooksController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)('reorder/sort'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CashbooksController.prototype, "reorder", null);
__decorate([
    (0, common_1.Get)(':id/members'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CashbooksController.prototype, "getMembers", null);
__decorate([
    (0, common_1.Post)(':id/members'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], CashbooksController.prototype, "inviteMember", null);
__decorate([
    (0, common_1.Post)(':id/members/link'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CashbooksController.prototype, "createInviteLink", null);
__decorate([
    (0, common_1.Delete)(':id/members/:memberId'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], CashbooksController.prototype, "removeMember", null);
__decorate([
    (0, common_1.Patch)(':id/members/:memberId'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('memberId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", void 0)
], CashbooksController.prototype, "updateMemberRole", null);
__decorate([
    (0, common_1.Delete)(':id/leave'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CashbooksController.prototype, "leaveBook", null);
__decorate([
    (0, common_1.Post)('accept-invite/:token'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CashbooksController.prototype, "acceptInvite", null);
exports.CashbooksController = CashbooksController = __decorate([
    (0, swagger_1.ApiTags)('cashbooks'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Controller)({ path: 'cashbooks', version: '1' }),
    __metadata("design:paramtypes", [cashbooks_service_1.CashbooksService,
        cashbooks_members_service_1.CashbookMembersService])
], CashbooksController);
//# sourceMappingURL=cashbooks.controller.js.map