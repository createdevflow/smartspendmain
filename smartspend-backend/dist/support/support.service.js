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
exports.SupportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SupportService = class SupportService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getTickets(userId) {
        return this.prisma.supportTicket.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            include: { replies: { orderBy: { createdAt: 'asc' } } },
        });
    }
    async createTicket(userId, dto) {
        return this.prisma.supportTicket.create({
            data: { userId, subject: dto.subject, message: dto.message, type: dto.type || 'contact_us', attachmentUrl: dto.attachmentUrl || null },
        });
    }
    async replyTicket(userId, ticketId, dto) {
        const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId, userId } });
        if (!ticket)
            throw new common_1.NotFoundException('Ticket not found');
        await this.prisma.supportTicket.update({ where: { id: ticketId }, data: { status: 'OPEN' } });
        return this.prisma.ticketReply.create({
            data: { ticketId, authorId: userId, message: dto.message, isAdmin: false },
        });
    }
};
exports.SupportService = SupportService;
exports.SupportService = SupportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SupportService);
//# sourceMappingURL=support.service.js.map