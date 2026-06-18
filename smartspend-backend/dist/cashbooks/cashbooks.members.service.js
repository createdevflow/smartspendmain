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
exports.CashbookMembersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const mail_service_1 = require("../mail/mail.service");
const crypto_1 = require("crypto");
let CashbookMembersService = class CashbookMembersService {
    constructor(prisma, mail) {
        this.prisma = prisma;
        this.mail = mail;
    }
    async assertOwner(userId, cashbookId) {
        const book = await this.prisma.cashbook.findFirst({
            where: { id: cashbookId, userId, deletedAt: null },
        });
        if (!book)
            throw new common_1.ForbiddenException('You are not the owner of this cashbook');
        return book;
    }
    async assertFeatureEnabled() {
        const setting = await this.prisma.systemSetting.findUnique({
            where: { key: 'feature_shared_cashbooks_active' },
        });
        if (setting?.value === 'false') {
            throw new common_1.ForbiddenException('Shared cashbooks feature is currently disabled');
        }
    }
    async getMembers(userId, cashbookId) {
        const book = await this.prisma.cashbook.findFirst({
            where: { id: cashbookId, deletedAt: null },
        });
        if (!book)
            throw new common_1.NotFoundException('Cashbook not found');
        const isMember = book.userId === userId || await this.prisma.cashbookMember.findFirst({
            where: { cashbookId, userId, status: 'accepted' },
        });
        if (!isMember)
            throw new common_1.ForbiddenException('Access denied');
        const members = await this.prisma.cashbookMember.findMany({
            where: { cashbookId },
            include: { user: { select: { id: true, fullName: true, email: true, avatar: true } } },
            orderBy: { invitedAt: 'asc' },
        });
        const owner = await this.prisma.user.findUnique({
            where: { id: book.userId },
            select: { id: true, fullName: true, email: true, avatar: true },
        });
        return {
            owner: { ...owner, role: 'OWNER' },
            members,
        };
    }
    async inviteMember(userId, cashbookId, dto) {
        await this.assertFeatureEnabled();
        const book = await this.assertOwner(userId, cashbookId);
        const inviter = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true, fullName: true } });
        if (inviter?.email.toLowerCase() === dto.email.toLowerCase()) {
            throw new common_1.BadRequestException('You cannot invite yourself');
        }
        const existing = await this.prisma.cashbookMember.findUnique({
            where: { cashbookId_email: { cashbookId, email: dto.email } },
        });
        const token = (0, crypto_1.randomBytes)(32).toString('hex');
        const targetUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
        let member;
        if (existing) {
            if (existing.status === 'accepted')
                throw new common_1.ConflictException('This user is already a member');
            member = await this.prisma.cashbookMember.update({
                where: { id: existing.id },
                data: { role: dto.role, inviteToken: token, invitedAt: new Date() },
            });
        }
        else {
            member = await this.prisma.cashbookMember.create({
                data: {
                    cashbookId,
                    email: dto.email,
                    role: dto.role,
                    inviteToken: token,
                    userId: targetUser?.id,
                },
            });
        }
        if (targetUser) {
            await this.prisma.notification.create({
                data: {
                    userId: targetUser.id,
                    type: 'IN_APP',
                    title: 'Cashbook Invite',
                    body: `${inviter?.fullName || 'Someone'} invited you to join '${book.name}' as a ${dto.role.toLowerCase()}.`,
                    data: { cashbookId, token },
                    actionUrl: `smartspend://invite/${token}`
                }
            });
        }
        await this.sendInviteEmail(dto.email, inviter?.fullName || 'Someone', book.name, token);
        return { message: 'Invite sent', token };
    }
    async createInviteLink(userId, cashbookId) {
        await this.assertFeatureEnabled();
        await this.assertOwner(userId, cashbookId);
        const token = (0, crypto_1.randomBytes)(16).toString('hex');
        await this.prisma.cashbookMember.create({
            data: {
                cashbookId,
                email: `link_${token}@shared.local`,
                role: 'VIEWER',
                inviteToken: token,
            },
        });
        return { token, link: `smartspend://invite/${token}` };
    }
    async acceptInvite(userId, token) {
        const member = await this.prisma.cashbookMember.findUnique({ where: { inviteToken: token } });
        if (!member)
            throw new common_1.NotFoundException('Invalid or expired invite link');
        if (member.status === 'accepted')
            throw new common_1.ConflictException('Invite already accepted');
        const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
        const isGenericLink = member.email.startsWith('link_') && member.email.endsWith('@shared.local');
        if (!isGenericLink && member.email.toLowerCase() !== user?.email?.toLowerCase()) {
            throw new common_1.ForbiddenException('This invite was sent to a different email address');
        }
        await this.prisma.cashbookMember.update({
            where: { id: member.id },
            data: { userId, status: 'accepted', acceptedAt: new Date(), inviteToken: null },
        });
        return { message: 'You have joined the cashbook', cashbookId: member.cashbookId };
    }
    async removeMember(userId, cashbookId, memberId) {
        await this.assertOwner(userId, cashbookId);
        const member = await this.prisma.cashbookMember.findFirst({ where: { id: memberId, cashbookId } });
        if (!member)
            throw new common_1.NotFoundException('Member not found');
        await this.prisma.cashbookMember.delete({ where: { id: memberId } });
        return { message: 'Member removed' };
    }
    async updateMemberRole(userId, cashbookId, memberId, role) {
        await this.assertOwner(userId, cashbookId);
        const member = await this.prisma.cashbookMember.findFirst({ where: { id: memberId, cashbookId } });
        if (!member)
            throw new common_1.NotFoundException('Member not found');
        return this.prisma.cashbookMember.update({ where: { id: memberId }, data: { role: role } });
    }
    async leaveBook(userId, cashbookId) {
        const member = await this.prisma.cashbookMember.findFirst({ where: { cashbookId, userId } });
        if (!member)
            throw new common_1.NotFoundException('You are not a member of this cashbook');
        await this.prisma.cashbookMember.delete({ where: { id: member.id } });
        return { message: 'You have left the cashbook' };
    }
    async sendInviteEmail(toEmail, inviterName, bookName, token) {
        try {
            console.log(`[INVITE] To: ${toEmail} | Token: ${token}`);
        }
        catch (e) {
            console.error('Failed to send invite email', e);
        }
    }
};
exports.CashbookMembersService = CashbookMembersService;
exports.CashbookMembersService = CashbookMembersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mail_service_1.MailService])
], CashbookMembersService);
//# sourceMappingURL=cashbooks.members.service.js.map