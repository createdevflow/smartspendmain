"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheModule = exports.REDIS_CLIENT = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cache_service_1 = require("./cache.service");
const ioredis_1 = require("ioredis");
exports.REDIS_CLIENT = 'REDIS_CLIENT';
let CacheModule = class CacheModule {
};
exports.CacheModule = CacheModule;
exports.CacheModule = CacheModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [
            {
                provide: 'REDIS_CLIENT',
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    const client = new ioredis_1.default(config.get('redis.url') || 'redis://localhost:6379', {
                        maxRetriesPerRequest: 3,
                        retryStrategy: (times) => Math.min(times * 100, 3000),
                        lazyConnect: true,
                    });
                    client.on('error', (err) => console.error('Redis error:', err));
                    return client;
                },
            },
            cache_service_1.CacheService,
        ],
        exports: [cache_service_1.CacheService, 'REDIS_CLIENT'],
    })
], CacheModule);
//# sourceMappingURL=cache.module.js.map