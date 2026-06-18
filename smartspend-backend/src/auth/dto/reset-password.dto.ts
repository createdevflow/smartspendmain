import { IsEmail, IsString, MinLength, MaxLength, Length, Matches } from 'class-validator';
export class ResetPasswordDto {
  @IsEmail() email: string;
  @IsString() @Length(6, 6) otp: string;
  @IsString() @MinLength(8) @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, { message: 'Password too weak' })
  newPassword: string;
}
