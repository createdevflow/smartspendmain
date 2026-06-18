import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PLAN_FEATURE_KEY } from '../decorators/plan-feature.decorator';
import { FeaturesService } from '../../plans/features.service';

@Injectable()
export class PlanFeatureGuard implements CanActivate {
  constructor(private reflector: Reflector, private features: FeaturesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const featureKey = this.reflector.get<string>(PLAN_FEATURE_KEY, context.getHandler());
    if (!featureKey) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;

    const canUse = await this.features.canUse(user.sub, featureKey);
    if (!canUse) {
      throw new ForbiddenException({
        code: 'PLAN_FEATURE_REQUIRED',
        feature: featureKey,
        message: 'This feature requires a plan upgrade',
      });
    }
    return true;
  }
}
