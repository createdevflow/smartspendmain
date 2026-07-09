import { Module, Global } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { MediaStorageProvider } from './media.storage';
import { MediaSecurityService } from './media.security';
import { MediaOptimizerService } from './media.optimizer';
import { MediaCleanupService } from './media.cleanup.service';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [MediaController],
  providers: [
    MediaService,
    MediaStorageProvider,
    MediaSecurityService,
    MediaOptimizerService,
    MediaCleanupService,
  ],
  exports: [
    MediaService,
    MediaStorageProvider,
    MediaSecurityService,
    MediaOptimizerService,
    MediaCleanupService,
  ],
})
export class MediaModule {}
