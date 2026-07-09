import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiPiiMasker } from './ai-pii.util';
import { AiValidationUtil } from './ai-validation.util';
import { AiController } from './ai.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AiController],
  providers: [AiService, AiPiiMasker, AiValidationUtil],
  exports: [AiService],
})
export class AiModule {}
