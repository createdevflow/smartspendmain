import { Module } from '@nestjs/common';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { FeaturesService } from './features.service';

@Module({
  controllers: [PlansController],
  providers: [PlansService, FeaturesService],
  exports: [PlansService, FeaturesService],
})
export class PlansModule {}
