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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcrypt");
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { plan: { select: { id: true, name: true, slug: true, color: true } } },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const { passwordHash, encryptionKeySalt, ...safe } = user;
        return safe;
    }
    async updateProfile(userId, dto) {
        const { fullName, defaultCurrency, timezone, language, avatar, phone, pushNotifications, emailReports } = dto;
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { ...(fullName ? { fullName } : {}), ...(defaultCurrency ? { defaultCurrency } : {}), ...(timezone ? { timezone } : {}), ...(language ? { language } : {}), ...(avatar !== undefined ? { avatar } : {}), ...(phone !== undefined ? { phone } : {}), ...(pushNotifications !== undefined ? { pushNotifications } : {}), ...(emailReports !== undefined ? { emailReports } : {}) },
        });
        const { passwordHash, encryptionKeySalt, ...safe } = updated;
        return safe;
    }
    async changePassword(userId, dto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.ForbiddenException('User not found');
        const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
        if (!valid)
            throw new common_1.ForbiddenException('Current password is incorrect');
        const hash = await bcrypt.hash(dto.newPassword, 12);
        await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
        return { message: 'Password changed successfully' };
    }
    async deleteAccount(userId) {
        await this.prisma.user.update({ where: { id: userId }, data: { deletedAt: new Date(), status: 'SUSPENDED' } });
        return { message: 'Account scheduled for deletion. You have 30 days to cancel.' };
    }
    async getSessions(userId) {
        return this.prisma.session.findMany({ where: { userId, isValid: true, expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' }, select: { id: true, deviceName: true, platform: true, ipAddress: true, createdAt: true, expiresAt: true } });
    }
    async revokeSession(userId, sessionId) {
        await this.prisma.session.updateMany({ where: { id: sessionId, userId }, data: { isValid: false } });
        return { message: 'Session revoked' };
    }
    async revokeAllSessions(userId) {
        await this.prisma.session.updateMany({ where: { userId }, data: { isValid: false } });
        return { message: 'All sessions revoked' };
    }
    async uploadAvatar(userId, base64Image) {
        const avatarUrl = base64Image.startsWith('data:') ? base64Image : `data:image/jpeg;base64,${base64Image}`;
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { avatar: avatarUrl },
        });
        const { passwordHash, encryptionKeySalt, ...safe } = updated;
        return safe;
    }
    async updatePushToken(userId, token) {
        await this.prisma.user.update({ where: { id: userId }, data: { expoPushToken: token } });
        return { message: 'Push token updated' };
    }
    async syncContacts(userId, phoneNumbers) {
        if (!phoneNumbers || phoneNumbers.length === 0)
            return [];
        const normalized = phoneNumbers
            .map(p => p.replace(/[\s\-\(\)]/g, ''))
            .filter(p => p.length >= 7);
        if (normalized.length === 0)
            return [];
        const users = await this.prisma.user.findMany({
            where: {
                phone: { in: normalized },
                id: { not: userId },
            },
            select: { id: true, fullName: true, avatar: true, phone: true, email: true },
        });
        return users;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map