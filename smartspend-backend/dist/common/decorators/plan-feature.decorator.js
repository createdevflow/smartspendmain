"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequireFeature = exports.PLAN_FEATURE_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.PLAN_FEATURE_KEY = 'planFeature';
const RequireFeature = (featureKey) => (0, common_1.SetMetadata)(exports.PLAN_FEATURE_KEY, featureKey);
exports.RequireFeature = RequireFeature;
//# sourceMappingURL=plan-feature.decorator.js.map