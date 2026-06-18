import { IsOptional, IsNumber, IsEnum, IsString, IsArray, IsBoolean, Min, IsDateString } from 'class-validator';
import { TransactionType, TransactionLabel } from '@prisma/client';

export class UpdateTransactionDto {
  @IsOptional() @IsNumber() @Min(0.000001) amount?: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsEnum(TransactionType) type?: TransactionType;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() merchant?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() paymentMethod?: string;
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsArray() @IsEnum(TransactionLabel, { each: true }) labels?: TransactionLabel[];
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsBoolean() isGstApplied?: boolean;
  @IsOptional() @IsNumber() gstRate?: number;
}
