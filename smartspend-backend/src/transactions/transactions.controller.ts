import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { BulkImportDto } from './dto/bulk-import.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('transactions')
@ApiBearerAuth('JWT')
@Controller({ path: 'transactions', version: '1' })
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'List transactions with filters and pagination' })
  findAll(@CurrentUser() user: any, @Query() query: TransactionQueryDto) {
    return this.transactionsService.findAll(user.sub, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a transaction' })
  create(@CurrentUser() user: any, @Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(user.sub, dto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Full-text search transactions' })
  search(@CurrentUser() user: any, @Query('q') q: string) {
    return this.transactionsService.search(user.sub, q);
  }

  @Post('import')
  @ApiOperation({ summary: 'Bulk import (offline sync batch)' })
  import(@CurrentUser() user: any, @Body() dto: BulkImportDto) {
    return this.transactionsService.bulkImport(user.sub, dto.transactions);
  }

  @Post('bulk-delete')
  @ApiOperation({ summary: 'Delete multiple transactions' })
  bulkDelete(@CurrentUser() user: any, @Body() body: { ids: string[] }) {
    return this.transactionsService.bulkDelete(user.sub, body.ids);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single transaction' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.transactionsService.findOne(user.sub, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction' })
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateTransactionDto) {
    return this.transactionsService.update(user.sub, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a transaction (soft delete)' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.transactionsService.remove(user.sub, id);
  }

  @Post('scan-receipt')
  @ApiOperation({ summary: 'Mock AI OCR Receipt Scanner' })
  async scanReceipt(@CurrentUser() user: any, @Body() body: { imageBase64: string }) {
    return this.transactionsService.scanReceiptMock(user.sub, body.imageBase64);
  }
}
