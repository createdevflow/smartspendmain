import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const client = new Redis(config.get<string>('redis.url') || 'redis://localhost:6379', {
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => Math.min(times * 100, 3000),
          lazyConnect: true,
        });
        client.on('error', (err) => console.error('Redis error:', err));
        return client;
      },
    },
    CacheService,
  ],
  exports: [CacheService, 'REDIS_CLIENT'],
})
export class CacheModule {}
