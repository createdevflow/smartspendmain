import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches, IsMobilePhone } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Ankur Sharma' })
  @IsString() @MaxLength(100)
  fullName: string;

  @ApiProperty({ example: 'ankur@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsMobilePhone()
  phone?: string;

  @ApiProperty({ example: 'SecurePass@123', description: 'Min 8 chars, must have uppercase, lowercase, number, special char' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain uppercase, lowercase, number, and special character',
  })
  password: string;

  @ApiPropertyOptional({ example: 'INR' })
  @IsOptional() @IsString() @MaxLength(3)
  defaultCurrency?: string;
}
