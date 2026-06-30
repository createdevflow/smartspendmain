import {
  Injectable, UnauthorizedException, BadRequestException,
  ConflictException, ForbiddenException, NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { CacheService } from '../cache/cache.service';
import { MailService } from '../mail/mail.service';
import { AuditService } from '../audit/audit.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { AuditAction } from '@prisma/client';

const BCRYPT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 900; // 15 minutes

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private crypto: CryptoService,
    private cache: CacheService,
    private mail: MailService,
    private audit: AuditService,
  ) {}

  // ── Register ────────────────────────────────────────────────────────────────

  async register(dto: RegisterDto, ip: string, ua: string) {
    // Check if registration is globally enabled
    const regToggle = await this.prisma.appConfig.findFirst({ where: { key: 'feature_user_registration' } });
    if (regToggle && regToggle.value === 'false') {
      throw new ForbiddenException('New user registration is currently disabled. Please try again later.');
    }

    // Check duplicates
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email.toLowerCase() },
          ...(dto.phone ? [{ phone: dto.phone }] : []),
        ]
      },
    });
    if (existing) throw new ConflictException('An account with this email or phone already exists');

    // Get default plan
    const freePlan = await this.prisma.plan.findFirst({ where: { isDefault: true } });

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const encryptionKeySalt = this.crypto.generateSalt();

    // Determine trial expiration
    const trialConfig = await this.prisma.appConfig.findUnique({ where: { key: 'free_trial_days' } });
    const trialDays = trialConfig ? parseInt(trialConfig.value, 10) : 7;
    const trialExpiresAt = new Date();
    trialExpiresAt.setDate(trialExpiresAt.getDate() + trialDays);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName.trim(),
        email: dto.email.toLowerCase().trim(),
        phone: dto.phone ? dto.phone.trim() : null,
        passwordHash,
        encryptionKeySalt,
        planId: freePlan?.id ?? null,
        defaultCurrency: dto.defaultCurrency || 'INR',
        trialExpiresAt,
      },
    });

    // Send email OTP
    await this.sendOtp(user.id, user.email, user.fullName, 'email_verify');

    await this.audit.log({ userId: user.id, action: AuditAction.REGISTER, ipAddress: ip, userAgent: ua });

    return { message: 'Account created. Please check your email for the verification code.' };
  }

  // ── Login ───────────────────────────────────────────────────────────────────

  async login(dto: LoginDto, ip: string, ua: string) {
    const bruteKey = `${ip}:${dto.emailOrPhone}`;

    // Brute force check
    const attempts = await this.cache.getBruteForceCount(bruteKey);
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      const remaining = await this.cache.ttl(`brute:${bruteKey}`);
      throw new ForbiddenException(`Too many failed attempts. Try again in ${Math.ceil(remaining / 60)} minutes.`);
    }

    const searchStr = dto.emailOrPhone.toLowerCase().trim();
    // Fetch user WITH full plan features for gating
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: searchStr },
          { phone: searchStr }
        ]
      },
      include: {
        plan: {
          include: {
            features: {
              include: { feature: true },
              orderBy: { feature: { sortOrder: 'asc' } },
            },
          },
        },
      },
    });

    const passwordValid = user && await bcrypt.compare(dto.password, user.passwordHash);

    if (!user || !passwordValid) {
      await this.cache.incrementBruteForce(bruteKey, LOCKOUT_SECONDS);
      await this.audit.log({ userId: user?.id, action: AuditAction.LOGIN_FAILED, ipAddress: ip, userAgent: ua });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.deletedAt) {
      const daysSince = (Date.now() - user.deletedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince > 30) {
        throw new ForbiddenException('Account is permanently inaccessible.');
      }
      // Restore account
      await this.prisma.user.update({
        where: { id: user.id },
        data: { deletedAt: null, status: 'ACTIVE' },
      });
      user.deletedAt = null;
      user.status = 'ACTIVE';
    }

    if (user.status === 'BANNED') throw new ForbiddenException('This account has been banned.');
    if (user.status === 'SUSPENDED') throw new ForbiddenException('This account has been suspended. Contact support.');
    if (!user.isEmailVerified) {
      // Resend OTP and ask to verify
      await this.sendOtp(user.id, user.email, user.fullName, 'email_verify');
      throw new ForbiddenException('Email not verified. A new verification code has been sent.');
    }

    // Clear brute force counter
    await this.cache.resetBruteForce(bruteKey);

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokenPair(user, ip, ua, dto.deviceName, dto.platform);

    // Update last login
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await this.audit.log({ userId: user.id, action: AuditAction.LOGIN, ipAddress: ip, userAgent: ua });

    return {
      accessToken,
      refreshToken,
      user: await this.formatUserWithEffectiveTrial(user),
    };
  }

  // ── Verify OTP ──────────────────────────────────────────────────────────────

  async verifyOtp(dto: VerifyOtpDto, purpose: string) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase(), deletedAt: null },
    });
    if (!user) throw new NotFoundException('Account not found');

    const otpRecord = await this.prisma.otpToken.findFirst({
      where: { userId: user.id, purpose, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) throw new BadRequestException('No verification code found. Please request a new one.');
    if (new Date() > otpRecord.expiresAt) throw new BadRequestException('Verification code has expired. Please request a new one.');
    if (otpRecord.attempts >= 3) throw new BadRequestException('Too many incorrect attempts. Please request a new code.');

    const valid = await bcrypt.compare(dto.otp, otpRecord.tokenHash);
    if (!valid) {
      await this.prisma.otpToken.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Incorrect verification code');
    }

    // Mark OTP used
    await this.prisma.otpToken.update({ where: { id: otpRecord.id }, data: { usedAt: new Date() } });

    if (purpose === 'email_verify') {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { isEmailVerified: true, status: 'ACTIVE' },
      });
      await this.audit.log({ userId: user.id, action: AuditAction.EMAIL_VERIFIED });
    }

    return { message: purpose === 'email_verify' ? 'Email verified successfully!' : 'Code verified.' };
  }

  // ── Forgot Password ─────────────────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase(), deletedAt: null },
    });
    // Always return success (don't reveal if email exists)
    if (!user) return { message: 'If this email is registered, you will receive a reset code.' };

    await this.sendOtp(user.id, user.email, user.fullName, 'password_reset');
    return { message: 'Password reset code sent to your email.' };
  }

  // ── Reset Password ──────────────────────────────────────────────────────────

  async resetPassword(dto: ResetPasswordDto) {
    await this.verifyOtp({ email: dto.email, otp: dto.otp }, 'password_reset');

    const user = await this.prisma.user.findFirst({ where: { email: dto.email.toLowerCase() } });
    if (!user) throw new NotFoundException('User not found');
    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    // Invalidate all sessions
    await this.prisma.session.updateMany({
      where: { userId: user.id },
      data: { isValid: false },
    });

    await this.audit.log({ userId: user.id, action: AuditAction.PASSWORD_RESET });
    return { message: 'Password reset successfully. Please login with your new password.' };
  }

  // ── Resend OTP ──────────────────────────────────────────────────────────────

  async resendOtp(dto: ResendOtpDto) {
    const cooldownKey = `otp:cooldown:${dto.email}:${dto.purpose}`;
    if (await this.cache.exists(cooldownKey)) {
      const ttl = await this.cache.ttl(cooldownKey);
      throw new BadRequestException(`Please wait ${ttl} seconds before requesting another code.`);
    }

    const user = await this.prisma.user.findFirst({ where: { email: dto.email.toLowerCase() } });
    if (!user) return { message: 'If this email is registered, a code will be sent.' };

    await this.sendOtp(user.id, user.email, user.fullName, dto.purpose as any);
    await this.cache.set(cooldownKey, '1', 60); // 60s cooldown

    return { message: 'Verification code sent.' };
  }

  // ── Refresh Tokens ──────────────────────────────────────────────────────────

  async refreshTokens(refreshToken: string, ip: string, ua: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });

      // Find valid session with matching token
      const sessions = await this.prisma.session.findMany({
        where: { userId: payload.sub, isValid: true, expiresAt: { gt: new Date() } },
        include: { user: true },
      });

      let matchedSession: any = null;
      for (const session of sessions) {
        const match = await bcrypt.compare(refreshToken, session.refreshToken);
        if (match) { matchedSession = session; break; }
      }

      if (!matchedSession) throw new UnauthorizedException('Invalid or expired refresh token');

      // Invalidate old session (rotation)
      await this.prisma.session.update({
        where: { id: matchedSession.id },
        data: { isValid: false },
      });

      // Issue new token pair
      const { accessToken, refreshToken: newRefresh } = await this.generateTokenPair(
        matchedSession.user, ip, ua,
        matchedSession.deviceName, matchedSession.platform,
      );

      return { accessToken, refreshToken: newRefresh };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  // ── Logout ──────────────────────────────────────────────────────────────────

  async logout(userId: string, refreshToken: string) {
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
    await this.audit.log({ userId, action: AuditAction.LOGOUT });
    return { message: 'Logged out successfully' };
  }

  // ── Get Me ──────────────────────────────────────────────────────────────────

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { plan: { include: { features: { include: { feature: true } } } } },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.formatUserWithEffectiveTrial(user);
  }

  // ── Private Helpers ──────────────────────────────────────────────────────────

  private async sendOtp(userId: string, email: string, name: string, purpose: 'email_verify' | 'password_reset') {
    const otpPlain = this.crypto.generateOtp(6);
    const tokenHash = await bcrypt.hash(otpPlain, 10);
    const expiryMinutes = this.config.get<number>('otp.expiryMinutes', 10);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Invalidate previous OTPs for same purpose
    await this.prisma.otpToken.updateMany({
      where: { userId, purpose, usedAt: null },
      data: { usedAt: new Date() },
    });

    await this.prisma.otpToken.create({ data: { userId, tokenHash, purpose, expiresAt } });
    await this.mail.sendOtp(email, name, otpPlain, purpose);
  }

  private async generateTokenPair(user: any, ip: string, ua: string, deviceName?: string, platform?: string) {
    const payload = { sub: user.id, email: user.email, role: user.role, plan: user.planId };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('jwt.accessSecret'),
      expiresIn: this.config.get<string>('jwt.accessExpiresIn'),
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('jwt.refreshSecret'),
      expiresIn: this.config.get<string>('jwt.refreshExpiresIn'),
    });

    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

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

  private async formatUserWithEffectiveTrial(user: any) {
    if (!user) return user;
    const trialConfig = await this.prisma.appConfig.findUnique({ where: { key: 'free_trial_days' } });
    const trialDays = trialConfig ? parseInt(trialConfig.value, 10) : 7;
    if (!isNaN(trialDays) && trialDays <= 0) {
      user.trialExpiresAt = null;
    } else if (!isNaN(trialDays) && trialDays > 0 && user.createdAt) {
      const expiry = new Date(user.createdAt);
      expiry.setDate(expiry.getDate() + trialDays);
      user.trialExpiresAt = expiry;
    }
    return this.sanitizeUser(user);
  }

  private sanitizeUser(user: any) {
    const { passwordHash, encryptionKeySalt, ...safe } = user;
    return safe;
  }
}
