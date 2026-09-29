import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        // Limite general: 100 requests / 15 min
        ttl: 900000,
        limit: 100,
        name: 'general',
      },
      {
        // Endpoints de auth (login, register, demo-login): 5 intentos / 15 min
        ttl: 900000,
        limit: 5,
        name: 'auth',
      },
      {
        // API general: 50 req/min
        ttl: 60000,
        limit: 50,
        name: 'api',
      },
      {
        // Busqueda/listados publicos del marketplace: 30 req/min
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
