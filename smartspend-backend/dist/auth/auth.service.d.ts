import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
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
export declare class AuthService {
    private prisma;
    private jwt;
    private config;
    private crypto;
    private cache;
    private mail;
    private audit;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService, crypto: CryptoService, cache: CacheService, mail: MailService, audit: AuditService);
    register(dto: RegisterDto, ip: string, ua: string): Promise<{
        message: string;
    }>;
    login(dto: LoginDto, ip: string, ua: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
    }>;
    verifyOtp(dto: VerifyOtpDto, purpose: string): Promise<{
        message: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    resendOtp(dto: ResendOtpDto): Promise<{
        message: string;
    }>;
    refreshTokens(refreshToken: string, ip: string, ua: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: string, refreshToken: string): Promise<{
        message: string;
    }>;
    getMe(userId: string): Promise<any>;
    private sendOtp;
    private generateTokenPair;
    private sanitizeUser;
}
