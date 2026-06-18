import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    if (!value) return null;
    try { return JSON.parse(value) as T; } catch { return value as unknown as T; }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds) {
      await this.redis.setex(key, ttlSeconds, serialized);
    } else {
      await this.redis.set(key, serialized);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) await this.redis.del(...keys);
  }

  async increment(key: string, ttlSeconds?: number): Promise<number> {
    const count = await this.redis.incr(key);
    if (ttlSeconds && count === 1) await this.redis.expire(key, ttlSeconds);
    return count;
  }

  async exists(key: string): Promise<boolean> {
    return (await this.redis.exists(key)) === 1;
  }

  async ttl(key: string): Promise<number> {
    return this.redis.ttl(key);
  }

  /** Brute-force counter for login attempts */
  async getBruteForceCount(identifier: string): Promise<number> {
    const count = await this.redis.get(`brute:${identifier}`);
    return count ? parseInt(count, 10) : 0;
  }

  async incrementBruteForce(identifier: string, windowSeconds = 900): Promise<number> {
    return this.increment(`brute:${identifier}`, windowSeconds);
  }

  async resetBruteForce(identifier: string): Promise<void> {
    await this.del(`brute:${identifier}`);
  }
}
