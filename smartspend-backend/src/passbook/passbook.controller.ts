import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PassbookService } from './passbook.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Response } from 'express';

@ApiTags('passbook')
@ApiBearerAuth('JWT')
@Controller({ path: 'passbook', version: '1' })
export class PassbookController {
  constructor(private readonly passbookService: PassbookService) {}

  @Get()
  @ApiOperation({ summary: 'Generate passbook PDF' })
  async generatePdf(
    @CurrentUser() user: any,
    @Query('cashbookId') cashbookId: string,
    @Query('month') month: string,
    @Res() res: Response,
  ) {
    const buffer = await this.passbookService.generatePdf(user.sub, cashbookId, month);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=passbook-${month}.pdf`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('csv')
  @ApiOperation({ summary: 'Export transactions to CSV' })
  async exportCsv(
    @CurrentUser() user: any,
    @Query('cashbookId') cashbookId: string,
    @Query('month') month: string,
    @Res() res: Response,
  ) {
    const csv = await this.passbookService.generateCsv(user.sub, cashbookId, month);
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename=transactions-${month}.csv`,
    });
    res.send(csv);
  }
}
