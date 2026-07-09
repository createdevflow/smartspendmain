import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, IsDateString, Min, Max, MaxLength } from 'class-validator';
import { BudgetPeriod } from '@prisma/client';
import { SanitizeHtml } from '../../common/decorators/sanitize.decorator';

export class UpdateBudgetDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @SanitizeHtml()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(9999999999)
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsString()
  cashbookId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsEnum(BudgetPeriod)
  period?: BudgetPeriod;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  rollover?: boolean;

  @IsOptional()
  @IsBoolean()
  alertAt50?: boolean;

  @IsOptional()
  @IsBoolean()
  alertAt80?: boolean;

  @IsOptional()
  @IsBoolean()
  alertAt100?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
