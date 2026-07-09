import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';

@Injectable()
export class WsThrottlerGuard extends ThrottlerGuard implements CanActivate {
  async handleRequest(requestProps: any): Promise<boolean> {
    const { context, limit, ttl, throttler, blockDuration } = requestProps;
    const client = context.switchToWs().getClient();
    const ip = client.conn?.remoteAddress || client.id;
    
    // Use the ThrottlerStorage to check the limit
    const key = this.generateKey(context, ip, throttler.name);
    const { totalHits } = await this.storageService.increment(key, ttl, limit, blockDuration, throttler.name);
    
    if (totalHits > limit) {
      throw new ThrottlerException('Too many messages');
    }
    
    return true;
  }
}
