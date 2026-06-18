import { IsString, IsOptional, IsNumber, IsHexColor, MaxLength, Min } from 'class-validator';

export class CreateCashbookDto {
  @IsString() @MaxLength(100) name: string;
  @IsOptional() @IsString() @MaxLength(300) description?: string;
  @IsOptional() @IsString() @IsHexColor() color?: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsNumber() @Min(0) openingBalance?: number;
}

export class UpdateCashbookDto {
  @IsOptional() @IsString() @MaxLength(100) name?: string;
  @IsOptional() @IsString() @MaxLength(300) description?: string;
  @IsOptional() @IsString() @IsHexColor() color?: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() isArchived?: boolean;
}
