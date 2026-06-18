import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SuggestCategoryDto {
  @IsOptional() @IsString() @MaxLength(200) merchant?: string;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}
