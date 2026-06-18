import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { CategoriesModule } from '../categories/categories.module';
import { CurrencyModule } from '../currency/currency.module';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [CategoriesModule, CurrencyModule, PlansModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
