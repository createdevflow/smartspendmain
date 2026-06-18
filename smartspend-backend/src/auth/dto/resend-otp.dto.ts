import { IsEmail, IsString, IsIn } from 'class-validator';
export class ResendOtpDto {
  @IsEmail() email: string;
  @IsString() @IsIn(['email_verify', 'password_reset']) purpose: string;
}
