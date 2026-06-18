import { IsOptional, IsString, IsEnum, IsNumber, IsArray, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType, TransactionLabel } from '@prisma/client';

export class TransactionQueryDto {
  @IsOptional() @IsString() cashbookId?: string;
  @IsOptional() @IsEnum(TransactionType) type?: TransactionType;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() from?: string;
  @IsOptional() @IsString() to?: string;
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsString() paymentMethod?: string;
  @IsOptional() @IsArray() @IsEnum(TransactionLabel, { each: true }) labels?: TransactionLabel[];
  @IsOptional() @Type(() => Number) @IsNumber() minAmount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() maxAmount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) @Max(100) limit?: number = 20;
  @IsOptional() @IsIn(['date', 'amount', 'createdAt']) sortBy?: string = 'date';
  @IsOptional() @IsIn(['asc', 'desc']) sortOrder?: string = 'desc';
}
