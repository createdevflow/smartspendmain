import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategorizationService } from './categorization.service';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, CategorizationService],
  exports: [CategoriesService, CategorizationService],
})
export class CategoriesModule {}
