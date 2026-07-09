import { IsOptional, IsNumber, IsEnum, IsString, IsArray, IsBoolean, Min, IsDateString, MaxLength } from 'class-validator';
import { TransactionType, TransactionLabel } from '@prisma/client';
import { SanitizeHtml } from '../../common/decorators/sanitize.decorator';

export class UpdateTransactionDto {
  @IsOptional() @IsNumber() @Min(0.000001) amount?: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsEnum(TransactionType) type?: TransactionType;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() @MaxLength(200) @SanitizeHtml() merchant?: string;
  @IsOptional() @IsString() @MaxLength(1000) @SanitizeHtml() notes?: string;
  @IsOptional() @IsString() @SanitizeHtml() paymentMethod?: string;

  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsArray() @IsEnum(TransactionLabel, { each: true }) labels?: TransactionLabel[];
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsBoolean() isGstApplied?: boolean;
  @IsOptional() @IsNumber() gstRate?: number;
  @IsOptional() @IsNumber() cgst?: number;
  @IsOptional() @IsNumber() sgst?: number;
  @IsOptional() @IsNumber() igst?: number;
}
