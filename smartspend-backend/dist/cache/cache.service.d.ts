import Redis from 'ioredis';
export declare class CacheService {
    private readonly redis;
    constructor(redis: Redis);
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: any, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    delPattern(pattern: string): Promise<void>;
    increment(key: string, ttlSeconds?: number): Promise<number>;
    exists(key: string): Promise<boolean>;
    ttl(key: string): Promise<number>;
    getBruteForceCount(identifier: string): Promise<number>;
    incrementBruteForce(identifier: string, windowSeconds?: number): Promise<number>;
    resetBruteForce(identifier: string): Promise<void>;
}
