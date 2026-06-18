import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeaturesService } from '../../plans/features.service';
export declare class PlanFeatureGuard implements CanActivate {
    private reflector;
    private features;
    constructor(reflector: Reflector, features: FeaturesService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
