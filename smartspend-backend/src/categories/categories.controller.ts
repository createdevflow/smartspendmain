import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CategorizationService } from './categorization.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { SuggestCategoryDto } from './dto/suggest-category.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('categories')
@ApiBearerAuth('JWT')
@Controller({ path: 'categories', version: '1' })
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly categorization: CategorizationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories (system + user custom)' })
  findAll(@CurrentUser() user: any, @Query('type') type?: string) {
    return this.categoriesService.findAll(user.sub, type);
  }

  @Post()
  @ApiOperation({ summary: 'Create custom category' })
  create(@CurrentUser() user: any, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(user.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update custom category' })
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(user.sub, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete custom category' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.categoriesService.remove(user.sub, id);
  }

  /** The star feature: auto-suggest category while user types */
  @Post('suggest')
  @ApiOperation({ summary: 'Auto-suggest category from merchant/notes (smart categorization)' })
  suggest(@CurrentUser() user: any, @Body() dto: SuggestCategoryDto) {
    return this.categorization.suggestWithDetails(user.sub, dto.merchant, dto.notes);
  }
}
