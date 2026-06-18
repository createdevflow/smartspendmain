import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCashbookDto {
  @IsOptional() @IsString() @MaxLength(100) name?: string;
  @IsOptional() @IsString() @MaxLength(300) description?: string;
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() isArchived?: boolean;
}
