import { Global, Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ApiThrottlerGuard, AuthThrottlerGuard } from './scoped-throttler.guard';

// Ver ADR-023: corrige ADR-007. @nestjs/throttler aplica por defecto TODOS
// los throttlers nombrados a TODAS las rutas, asi que 'auth' (pensado solo
// para login) estaba bloqueando /orders y el resto de la API tras unos
// pocos requests. Se usan guards que filtran a un solo throttler nombrado
// cada uno (ver scoped-throttler.guard.ts): 'api' corre global via
// APP_GUARD, 'auth' solo se aplica explicitamente en los controllers de
// login con @UseGuards(AuthThrottlerGuard). Se eliminan 'general' (misma
// intencion que 'api', redundante y mas estricto en sostenido: 100/15min
// equivale a ~6.7/min, menos que el polling normal de varias pantallas) y
// 'search' (nunca se uso en ningun endpoint).
// @Global() para que AuthThrottlerGuard quede disponible via
// @UseGuards(AuthThrottlerGuard) en cualquier controller (AuthController,
// BuyerAuthController) sin tener que importar este modulo en cada uno.
@Global()
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        // API general: 120 req/min por IP. Cubre comodamente el polling de
        // 30s de varias pantallas (p.ej. /delivery hace 3 queries x 2/min)
        // mas varios usuarios detras del mismo IP/NAT, sin dejar de frenar
        // abuso o scraping evidente.
        ttl: 60000,
        limit: 120,
        name: 'api',
      },
      {
        // Endpoints de login (login, register, demo-login): 5 intentos / 15
        // min, contra brute-force de credenciales. Solo se aplica donde se
        // usa @UseGuards(AuthThrottlerGuard) explicitamente.
        ttl: 900000,
        limit: 5,
        name: 'auth',
      },
    ]),
  ],
  providers: [
    AuthThrottlerGuard,
    {
      provide: APP_GUARD,
      useClass: ApiThrottlerGuard,
    },
  ],
  exports: [AuthThrottlerGuard],
})
export class ThrottlingModule {}
