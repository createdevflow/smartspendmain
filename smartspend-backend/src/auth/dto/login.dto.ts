import { IsString, MinLength, MaxLength, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'ankur@example.com or +919876543210' })
  @IsString()
  @MaxLength(254) // RFC 5321 max email length
  emailOrPhone: string;

  @ApiProperty({ example: 'SecurePass@123' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @ApiPropertyOptional({ example: 'My iPhone 15 Pro' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceName?: string;

  @ApiPropertyOptional({ example: 'ios', enum: ['ios', 'android', 'web', 'other'] })
  @IsOptional()
  @IsIn(['ios', 'android', 'web', 'other'])
  platform?: string;
}
