import { Module } from '@nestjs/common';
import { CashbooksController } from './cashbooks.controller';
import { CashbooksService } from './cashbooks.service';
import { CashbookMembersService } from './cashbooks.members.service';
import { PlansModule } from '../plans/plans.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [PlansModule, MailModule],
  controllers: [CashbooksController],
  providers: [CashbooksService, CashbookMembersService],
  exports: [CashbooksService, CashbookMembersService],
})
export class CashbooksModule {}
