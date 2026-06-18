import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto, ip: string, ua: string): Promise<{
        message: string;
    }>;
    login(dto: LoginDto, ip: string, ua: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
    }>;
    verifyEmail(dto: VerifyOtpDto): Promise<{
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
    refresh(dto: RefreshTokenDto, ip: string, ua: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(user: any, dto: RefreshTokenDto): Promise<{
        message: string;
    }>;
    me(user: any): Promise<any>;
}
