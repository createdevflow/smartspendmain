"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashbooksModule = void 0;
const common_1 = require("@nestjs/common");
const cashbooks_controller_1 = require("./cashbooks.controller");
const cashbooks_service_1 = require("./cashbooks.service");
const cashbooks_members_service_1 = require("./cashbooks.members.service");
const plans_module_1 = require("../plans/plans.module");
const mail_module_1 = require("../mail/mail.module");
let CashbooksModule = class CashbooksModule {
};
exports.CashbooksModule = CashbooksModule;
exports.CashbooksModule = CashbooksModule = __decorate([
    (0, common_1.Module)({
        imports: [plans_module_1.PlansModule, mail_module_1.MailModule],
        controllers: [cashbooks_controller_1.CashbooksController],
        providers: [cashbooks_service_1.CashbooksService, cashbooks_members_service_1.CashbookMembersService],
        exports: [cashbooks_service_1.CashbooksService, cashbooks_members_service_1.CashbookMembersService],
    })
], CashbooksModule);
//# sourceMappingURL=cashbooks.module.js.map