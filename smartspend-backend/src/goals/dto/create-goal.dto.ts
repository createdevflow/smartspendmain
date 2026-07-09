import { IsString, IsNumber, IsOptional, IsDateString, Min, Max, MaxLength } from 'class-validator';
import { SanitizeHtml } from '../../common/decorators/sanitize.decorator';

export class CreateGoalDto {
  @IsString()
  @MaxLength(100)
  @SanitizeHtml()
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @SanitizeHtml()
  description?: string;

  @IsOptional()
  @IsString()
  emoji?: string;

  @IsNumber()
  @Min(1)
  @Max(9999999999)
  targetAmount: number;

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
}
