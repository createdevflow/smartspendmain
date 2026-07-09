import {
  IsString, IsNumber, IsEnum, IsOptional, IsBoolean,
  IsDateString, IsArray, Min, MaxLength, IsIn,
} from 'class-validator';
import { TransactionType, TransactionLabel } from '@prisma/client';
import { SanitizeHtml } from '../../common/decorators/sanitize.decorator';

export class CreateTransactionDto {
  @IsString() cashbookId: string;
  @IsNumber() @Min(0.000001) amount: number;
  @IsString() @MaxLength(3) currency: string;
  @IsEnum(TransactionType) type: TransactionType;
  @IsDateString() date: string;

  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() @MaxLength(200) @SanitizeHtml() merchant?: string;
  @IsOptional() @IsString() @MaxLength(1000) @SanitizeHtml() notes?: string;
  @IsOptional() @IsString() @SanitizeHtml() paymentMethod?: string;


  @IsOptional() @IsArray() @IsEnum(TransactionLabel, { each: true }) labels?: TransactionLabel[];
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];

  @IsOptional() @IsBoolean() isGstApplied?: boolean;
  @IsOptional() @IsNumber() gstRate?: number;
  @IsOptional() @IsNumber() cgst?: number;
  @IsOptional() @IsNumber() sgst?: number;
  @IsOptional() @IsNumber() igst?: number;

  @IsOptional() @IsBoolean() isRecurring?: boolean;
  @IsOptional() @IsString() recurringId?: string;
  @IsOptional() @IsString() receiptKey?: string;

  // Offline sync dedup key
  @IsOptional() @IsString() localId?: string;
}
