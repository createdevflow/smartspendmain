import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrencyService } from './currency.service';
import { IsNumber, IsString } from 'class-validator';
import { Public } from '../common/decorators/public.decorator';

class ConvertDto {
  @IsNumber() amount: number;
  @IsString() from: string;
  @IsString() to: string;
}

@ApiTags('currency')
@Controller({ path: 'currency', version: '1' })
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Public()
  @Get('supported')
  @ApiOperation({ summary: 'Get all supported currencies (public)' })
  getSupportedCurrencies() {
    return this.currencyService.getSupportedCurrencies();
  }

  @ApiBearerAuth('JWT')
  @Get('rates')
  @ApiOperation({ summary: 'Get all exchange rates (EUR base)' })
  getRates() {
    return this.currencyService.getAllRatesMap();
  }

  @ApiBearerAuth('JWT')
  @Post('convert')
  @ApiOperation({ summary: 'Convert amount between currencies' })
  async convert(@Body() dto: ConvertDto) {
    const result = await this.currencyService.convert(dto.amount, dto.from, dto.to);
    return { from: dto.from, to: dto.to, amount: dto.amount, converted: result };
  }
}
