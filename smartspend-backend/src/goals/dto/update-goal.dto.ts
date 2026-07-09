import { IsString, IsNumber, IsOptional, IsDateString, Min, Max, MaxLength, IsEnum } from 'class-validator';
import { GoalStatus } from '@prisma/client';
import { SanitizeHtml } from '../../common/decorators/sanitize.decorator';

export class UpdateGoalDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @SanitizeHtml()
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @SanitizeHtml()
  description?: string;

  @IsOptional()
  @IsString()
  emoji?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(9999999999)
  targetAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsString()
  linkedCashbookId?: string;

  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus;
}

export class ContributeGoalDto {
  @IsNumber()
  @Min(0.000001)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  @SanitizeHtml()
  note?: string;
}
