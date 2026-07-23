import {
  IsString, IsNumber, IsEnum, IsOptional,
  IsDateString, MaxLength, Min, IsIn,
} from 'class-validator';

export class CreateRecurringTransactionDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsNumber()
  @Min(0.000001)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsIn(['daily', 'weekly', 'monthly', 'yearly'])
  frequency: string;

  @IsDateString()
  startDate: string;
}

export class UpdateRecurringTransactionDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.000001)
  amount?: number;

  @IsOptional()
  @IsIn(['daily', 'weekly', 'monthly', 'yearly'])
  frequency?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;
}
