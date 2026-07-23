import { IsOptional, IsNumber, IsEnum, IsString, IsArray, IsBoolean, Min, Max, IsDateString, MaxLength } from 'class-validator';
import { TransactionType, TransactionLabel } from '@prisma/client';
import { SanitizeHtml } from '../../common/decorators/sanitize.decorator';

export class UpdateTransactionDto {
  @IsOptional() @IsNumber() @Min(0.000001) amount?: number;
  @IsOptional() @IsString() @MaxLength(3) currency?: string;
  @IsOptional() @IsEnum(TransactionType) type?: TransactionType;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() @MaxLength(200) @SanitizeHtml() merchant?: string;
  @IsOptional() @IsString() @MaxLength(1000) @SanitizeHtml() notes?: string;
  @IsOptional() @IsString() @SanitizeHtml() paymentMethod?: string;

  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsArray() @IsEnum(TransactionLabel, { each: true }) labels?: TransactionLabel[];
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsBoolean() isGstApplied?: boolean;
  /** Server re-validates against (amount * gstRate) / (100 + gstRate) */
  @IsOptional() @IsNumber() @Min(0) @Max(28) gstRate?: number;
  @IsOptional() @IsNumber() @Min(0) cgst?: number;
  @IsOptional() @IsNumber() @Min(0) sgst?: number;
  @IsOptional() @IsNumber() @Min(0) igst?: number;
  /** Must reference a key from a previous successful upload — client cannot inject arbitrary storage URLs */
  @IsOptional() @IsString() receiptKey?: string;
}
