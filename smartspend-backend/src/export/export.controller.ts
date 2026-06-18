import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { ExportService } from './export.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('export')
@ApiBearerAuth('JWT')
@Controller({ path: 'export', version: '1' })
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('tax-report')
  @ApiOperation({ summary: 'Export TAX_DEDUCTIBLE transactions as CSV for a given year' })
  async taxReport(
    @CurrentUser() user: any,
    @Query('year') year: string,
    @Res() res: Response,
  ) {
    const targetYear = parseInt(year) || new Date().getFullYear();
    const { csv, summary } = await this.exportService.generateTaxReport(user.sub, targetYear);

    // Send as CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="smartspend_tax_report_${targetYear}.csv"`,
    );
    res.setHeader('X-Summary', JSON.stringify(summary));
    res.send(csv);
  }

  @Get('tax-report/preview')
  @ApiOperation({ summary: 'Preview tax report summary (JSON, no file download)' })
  async taxReportPreview(
    @CurrentUser() user: any,
    @Query('year') year: string,
  ) {
    const targetYear = parseInt(year) || new Date().getFullYear();
    return this.exportService.generateTaxReport(user.sub, targetYear);
  }
}
