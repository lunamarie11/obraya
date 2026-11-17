import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

// Ver ADR-023: ThrottlerGuard de Nest, cuando se configuran varios throttlers
// nombrados en ThrottlerModule.forRoot([...]), aplica TODOS a TODAS las rutas
// por defecto (ver @nestjs/throttler/dist/throttler.guard.js: itera
// this.throttlers completo en cada canActivate). Eso hacia que 'auth'
// (5 intentos/15min, pensado solo para login) bloqueara /orders y cualquier
// otra ruta tras unos pocos requests. Estas subclases filtran this.throttlers
// a un solo throttler nombrado, para poder aplicar cada uno solo donde
// corresponde: ApiThrottlerGuard como guard global, AuthThrottlerGuard solo
// en los controllers de login via @UseGuards.
@Injectable()
export class ApiThrottlerGuard extends ThrottlerGuard {
  async onModuleInit() {
    await super.onModuleInit();
    this.throttlers = this.throttlers.filter((t) => t.name === 'api');
  }
}

@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  async onModuleInit() {
    await super.onModuleInit();
    this.throttlers = this.throttlers.filter((t) => t.name === 'auth');
  }
}
