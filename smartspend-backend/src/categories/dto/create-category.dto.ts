import { IsString, IsIn, IsOptional, IsHexColor, MaxLength } from 'class-validator';
import { SanitizeHtml } from '../../common/decorators/sanitize.decorator';

export class CreateCategoryDto {
  @IsString() @MaxLength(50) @SanitizeHtml() name: string;
  @IsString() @MaxLength(10) emoji: string;
  @IsString() @IsHexColor() color: string;
  @IsString() @IsIn(['income', 'expense', 'both']) type: string;
  @IsOptional() @IsString() parentId?: string;
}

export class UpdateCategoryDto {
  @IsOptional() @IsString() @MaxLength(50) @SanitizeHtml() name?: string;
  @IsOptional() @IsString() @MaxLength(10) emoji?: string;
  @IsOptional() @IsString() @IsHexColor() color?: string;
}

export class SuggestCategoryDto {
  @IsOptional() @IsString() @MaxLength(200) @SanitizeHtml() merchant?: string;
  @IsOptional() @IsString() @MaxLength(500) @SanitizeHtml() notes?: string;
}

