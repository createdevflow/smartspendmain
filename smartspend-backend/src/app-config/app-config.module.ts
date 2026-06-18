import { Module } from '@nestjs/common';
import { AppConfigController } from './app-config.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AppConfigController],
})
export class AppConfigModule {}
