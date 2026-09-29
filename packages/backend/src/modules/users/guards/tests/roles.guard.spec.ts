import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../roles.guard';
import { UserRole } from '../../entities/company-user.entity';

function makeContext(user: any): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let reflector: Reflector;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('permite el acceso si el handler no tiene @Roles()', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(makeContext({ role: UserRole.VENDEDOR }))).toBe(true);
  });

  it('permite el acceso si el rol del usuario esta en la lista requerida', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN, UserRole.LOGISTICA]);
    expect(guard.canActivate(makeContext({ role: UserRole.LOGISTICA }))).toBe(true);
  });

  it('rechaza el acceso si el rol del usuario no esta en la lista requerida', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    expect(() => guard.canActivate(makeContext({ role: UserRole.VENDEDOR }))).toThrow(ForbiddenException);
  });

  it('rechaza el acceso a Logistica en rutas solo-Admin', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    expect(() => guard.canActivate(makeContext({ role: UserRole.LOGISTICA }))).toThrow(ForbiddenException);
  });
});
