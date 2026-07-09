import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { ChatScheduler } from './chat.scheduler';
import { PrismaModule } from '../prisma/prisma.module';

import { AiModule } from '../ai/ai.module';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    AiModule,
    TransactionsModule,
    JwtModule.register({}),
    ScheduleModule.forRoot(),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, ChatScheduler],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
