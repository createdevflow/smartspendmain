import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'ankur@example.com or +919876543210' })
  @IsString()
  emailOrPhone: string;

  @ApiProperty({ example: 'SecurePass@123' })
  @IsString() @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: 'My iPhone 15 Pro' })
  @IsOptional() @IsString()
  deviceName?: string;

  @ApiPropertyOptional({ example: 'ios' })
  @IsOptional() @IsString()
  platform?: string;
}
