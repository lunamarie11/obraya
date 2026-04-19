import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        // Default rate limit: 100 requests per 15 minutes (900 seconds)
        ttl: 900000, // ms
        limit: 100,
        name: 'general',
      },
      {
        // Auth endpoints: 5 attempts per 15 minutes
        ttl: 900000,
        limit: 5,
        name: 'auth',
      },
      {
        // API endpoints: 50 requests per minute
        ttl: 60000,
        limit: 50,
        name: 'api',
      },
      {
        // Search/list endpoints: 30 per minute
        ttl: 60000,
        limit: 30,
        name: 'search',
      },
    ]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class ThrottlingModule {}
