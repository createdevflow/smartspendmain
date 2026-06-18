"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
let CacheService = class CacheService {
    constructor(redis) {
        this.redis = redis;
    }
    async get(key) {
        const value = await this.redis.get(key);
        if (!value)
            return null;
        try {
            return JSON.parse(value);
        }
        catch {
            return value;
        }
    }
    async set(key, value, ttlSeconds) {
        const serialized = typeof value === 'string' ? value : JSON.stringify(value);
        if (ttlSeconds) {
            await this.redis.setex(key, ttlSeconds, serialized);
        }
        else {
            await this.redis.set(key, serialized);
        }
    }
    async del(key) {
        await this.redis.del(key);
    }
    async delPattern(pattern) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0)
            await this.redis.del(...keys);
    }
    async increment(key, ttlSeconds) {
        const count = await this.redis.incr(key);
        if (ttlSeconds && count === 1)
            await this.redis.expire(key, ttlSeconds);
        return count;
    }
    async exists(key) {
        return (await this.redis.exists(key)) === 1;
    }
    async ttl(key) {
        return this.redis.ttl(key);
    }
    async getBruteForceCount(identifier) {
        const count = await this.redis.get(`brute:${identifier}`);
        return count ? parseInt(count, 10) : 0;
    }
    async incrementBruteForce(identifier, windowSeconds = 900) {
        return this.increment(`brute:${identifier}`, windowSeconds);
    }
    async resetBruteForce(identifier) {
        await this.del(`brute:${identifier}`);
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('REDIS_CLIENT')),
    __metadata("design:paramtypes", [ioredis_1.default])
], CacheService);
//# sourceMappingURL=cache.service.js.map