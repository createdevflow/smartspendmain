import { IsString, IsOptional, IsNumber, IsHexColor, MaxLength, Min, IsBoolean } from 'class-validator';
import { SanitizeHtml } from '../../common/decorators/sanitize.decorator';

export class CreateCashbookDto {
  @IsString() @MaxLength(100) @SanitizeHtml() name: string;
  @IsOptional() @IsString() @MaxLength(300) @SanitizeHtml() description?: string;
  @IsOptional() @IsString() @IsHexColor() color?: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsNumber() @Min(0) openingBalance?: number;
}

export class UpdateCashbookDto {
  @IsOptional() @IsString() @MaxLength(100) @SanitizeHtml() name?: string;
  @IsOptional() @IsString() @MaxLength(300) @SanitizeHtml() description?: string;
  @IsOptional() @IsString() @IsHexColor() color?: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsBoolean() isArchived?: boolean;
}

