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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto_service_1 = require("../crypto/crypto.service");
const cache_service_1 = require("../cache/cache.service");
const mail_service_1 = require("../mail/mail.service");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
const BCRYPT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 900;
let AuthService = class AuthService {
    constructor(prisma, jwt, config, crypto, cache, mail, audit) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
        this.crypto = crypto;
        this.cache = cache;
        this.mail = mail;
        this.audit = audit;
    }
    async register(dto, ip, ua) {
        const existing = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: dto.email.toLowerCase() },
                    ...(dto.phone ? [{ phone: dto.phone }] : []),
                ]
            },
        });
        if (existing)
            throw new common_1.ConflictException('An account with this email or phone already exists');
        const freePlan = await this.prisma.plan.findFirst({ where: { isDefault: true } });
        const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
        const encryptionKeySalt = this.crypto.generateSalt();
        const user = await this.prisma.user.create({
            data: {
                fullName: dto.fullName.trim(),
                email: dto.email.toLowerCase().trim(),
                phone: dto.phone ? dto.phone.trim() : null,
                passwordHash,
                encryptionKeySalt,
                planId: freePlan?.id ?? null,
                defaultCurrency: dto.defaultCurrency || 'INR',
            },
        });
        await this.sendOtp(user.id, user.email, user.fullName, 'email_verify');
        await this.audit.log({ userId: user.id, action: client_1.AuditAction.REGISTER, ipAddress: ip, userAgent: ua });
        return { message: 'Account created. Please check your email for the verification code.' };
    }
    async login(dto, ip, ua) {
        const bruteKey = `${ip}:${dto.emailOrPhone}`;
        const attempts = await this.cache.getBruteForceCount(bruteKey);
        if (attempts >= MAX_LOGIN_ATTEMPTS) {
            const remaining = await this.cache.ttl(`brute:${bruteKey}`);
            throw new common_1.ForbiddenException(`Too many failed attempts. Try again in ${Math.ceil(remaining / 60)} minutes.`);
        }
        const searchStr = dto.emailOrPhone.toLowerCase().trim();
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: searchStr },
                    { phone: searchStr }
                ],
                deletedAt: null
            },
        });
        const passwordValid = user && await bcrypt.compare(dto.password, user.passwordHash);
        if (!user || !passwordValid) {
            await this.cache.incrementBruteForce(bruteKey, LOCKOUT_SECONDS);
            await this.audit.log({ userId: user?.id, action: client_1.AuditAction.LOGIN_FAILED, ipAddress: ip, userAgent: ua });
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.status === 'BANNED')
            throw new common_1.ForbiddenException('This account has been banned.');
        if (user.status === 'SUSPENDED')
            throw new common_1.ForbiddenException('This account has been suspended. Contact support.');
        if (!user.isEmailVerified) {
            await this.sendOtp(user.id, user.email, user.fullName, 'email_verify');
            throw new common_1.ForbiddenException('Email not verified. A new verification code has been sent.');
        }
        await this.cache.resetBruteForce(bruteKey);
        const { accessToken, refreshToken } = await this.generateTokenPair(user, ip, ua, dto.deviceName, dto.platform);
        await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        await this.audit.log({ userId: user.id, action: client_1.AuditAction.LOGIN, ipAddress: ip, userAgent: ua });
        return {
            accessToken,
            refreshToken,
            user: this.sanitizeUser(user),
        };
    }
    async verifyOtp(dto, purpose) {
        const user = await this.prisma.user.findFirst({
            where: { email: dto.email.toLowerCase(), deletedAt: null },
        });
        if (!user)
            throw new common_1.NotFoundException('Account not found');
        const otpRecord = await this.prisma.otpToken.findFirst({
            where: { userId: user.id, purpose, usedAt: null },
            orderBy: { createdAt: 'desc' },
        });
        if (!otpRecord)
            throw new common_1.BadRequestException('No verification code found. Please request a new one.');
        if (new Date() > otpRecord.expiresAt)
            throw new common_1.BadRequestException('Verification code has expired. Please request a new one.');
        if (otpRecord.attempts >= 3)
            throw new common_1.BadRequestException('Too many incorrect attempts. Please request a new code.');
        const valid = await bcrypt.compare(dto.otp, otpRecord.tokenHash);
        if (!valid) {
            await this.prisma.otpToken.update({
                where: { id: otpRecord.id },
                data: { attempts: { increment: 1 } },
            });
            throw new common_1.BadRequestException('Incorrect verification code');
        }
        await this.prisma.otpToken.update({ where: { id: otpRecord.id }, data: { usedAt: new Date() } });
        if (purpose === 'email_verify') {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { isEmailVerified: true, status: 'ACTIVE' },
            });
            await this.audit.log({ userId: user.id, action: client_1.AuditAction.EMAIL_VERIFIED });
        }
        return { message: purpose === 'email_verify' ? 'Email verified successfully!' : 'Code verified.' };
    }
    async forgotPassword(dto) {
        const user = await this.prisma.user.findFirst({
            where: { email: dto.email.toLowerCase(), deletedAt: null },
        });
        if (!user)
            return { message: 'If this email is registered, you will receive a reset code.' };
        await this.sendOtp(user.id, user.email, user.fullName, 'password_reset');
        return { message: 'Password reset code sent to your email.' };
    }
    async resetPassword(dto) {
        await this.verifyOtp({ email: dto.email, otp: dto.otp }, 'password_reset');
        const user = await this.prisma.user.findFirst({ where: { email: dto.email.toLowerCase() } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
        await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
        await this.prisma.session.updateMany({
            where: { userId: user.id },
            data: { isValid: false },
        });
        await this.audit.log({ userId: user.id, action: client_1.AuditAction.PASSWORD_RESET });
        return { message: 'Password reset successfully. Please login with your new password.' };
    }
    async resendOtp(dto) {
        const cooldownKey = `otp:cooldown:${dto.email}:${dto.purpose}`;
        if (await this.cache.exists(cooldownKey)) {
            const ttl = await this.cache.ttl(cooldownKey);
            throw new common_1.BadRequestException(`Please wait ${ttl} seconds before requesting another code.`);
        }
        const user = await this.prisma.user.findFirst({ where: { email: dto.email.toLowerCase() } });
        if (!user)
            return { message: 'If this email is registered, a code will be sent.' };
        await this.sendOtp(user.id, user.email, user.fullName, dto.purpose);
        await this.cache.set(cooldownKey, '1', 60);
        return { message: 'Verification code sent.' };
    }
    async refreshTokens(refreshToken, ip, ua) {
        try {
            const payload = this.jwt.verify(refreshToken, {
                secret: this.config.get('jwt.refreshSecret'),
            });
            const sessions = await this.prisma.session.findMany({
                where: { userId: payload.sub, isValid: true, expiresAt: { gt: new Date() } },
                include: { user: true },
            });
            let matchedSession = null;
            for (const session of sessions) {
                const match = await bcrypt.compare(refreshToken, session.refreshToken);
                if (match) {
                    matchedSession = session;
                    break;
                }
            }
            if (!matchedSession)
                throw new common_1.UnauthorizedException('Invalid or expired refresh token');
            await this.prisma.session.update({
                where: { id: matchedSession.id },
                data: { isValid: false },
            });
            const { accessToken, refreshToken: newRefresh } = await this.generateTokenPair(matchedSession.user, ip, ua, matchedSession.deviceName, matchedSession.platform);
            return { accessToken, refreshToken: newRefresh };
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
    }
    async logout(userId, refreshToken) {
        if (refreshToken) {
            const sessions = await this.prisma.session.findMany({
                where: { userId, isValid: true },
            });
            for (const session of sessions) {
                const match = await bcrypt.compare(refreshToken, session.refreshToken);
                if (match) {
                    await this.prisma.session.update({ where: { id: session.id }, data: { isValid: false } });
                    break;
                }
            }
        }
        await this.audit.log({ userId, action: client_1.AuditAction.LOGOUT });
        return { message: 'Logged out successfully' };
    }
    async getMe(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { plan: { include: { features: { include: { feature: true } } } } },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return this.sanitizeUser(user);
    }
    async sendOtp(userId, email, name, purpose) {
        const isDev = this.config.get('nodeEnv') === 'development' || process.env.NODE_ENV === 'development';
        const otpPlain = isDev ? '123456' : this.crypto.generateOtp(6);
        const tokenHash = await bcrypt.hash(otpPlain, 10);
        const expiryMinutes = this.config.get('otp.expiryMinutes', 10);
        const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
        await this.prisma.otpToken.updateMany({
            where: { userId, purpose, usedAt: null },
            data: { usedAt: new Date() },
        });
        await this.prisma.otpToken.create({ data: { userId, tokenHash, purpose, expiresAt } });
        await this.mail.sendOtp(email, name, otpPlain, purpose);
    }
    async generateTokenPair(user, ip, ua, deviceName, platform) {
        const payload = { sub: user.id, email: user.email, role: user.role, plan: user.planId };
        const accessToken = this.jwt.sign(payload, {
            secret: this.config.get('jwt.accessSecret'),
            expiresIn: this.config.get('jwt.accessExpiresIn'),
        });
        const refreshToken = this.jwt.sign(payload, {
            secret: this.config.get('jwt.refreshSecret'),
            expiresIn: this.config.get('jwt.refreshExpiresIn'),
        });
        const tokenHash = await bcrypt.hash(refreshToken, 10);
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await this.prisma.session.create({
            data: {
                userId: user.id,
                refreshToken: tokenHash,
                deviceName,
                platform,
                ipAddress: ip,
                userAgent: ua,
                expiresAt,
            },
        });
        return { accessToken, refreshToken };
    }
    sanitizeUser(user) {
        const { passwordHash, encryptionKeySalt, ...safe } = user;
        return safe;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        crypto_service_1.CryptoService,
        cache_service_1.CacheService,
        mail_service_1.MailService,
        audit_service_1.AuditService])
], AuthService);
//# sourceMappingURL=auth.service.js.map