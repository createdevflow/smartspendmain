import { IsString, IsOptional, IsBoolean, MaxLength, MinLength, IsArray, ArrayMaxSize } from 'class-validator';
import { SanitizeHtml } from '../../common/decorators/sanitize.decorator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @SanitizeHtml()
  fullName?: string;

  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  emailReports?: boolean;

  @IsOptional()
  preferences?: Record<string, any>;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword: string;
}

export class UpdatePushTokenDto {
  @IsString()
  @MaxLength(500)
  token: string;
}

export class UploadAvatarDto {
  @IsString()
  image: string; // Base64 or URL
}

export class SyncContactsDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(1000)
  phoneNumbers: string[];
}
