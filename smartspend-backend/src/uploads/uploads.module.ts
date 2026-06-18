import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { PlansModule } from '../plans/plans.module';

@Module({ imports: [PlansModule], controllers: [UploadsController], providers: [UploadsService], exports: [UploadsService] })
export class UploadsModule {}
