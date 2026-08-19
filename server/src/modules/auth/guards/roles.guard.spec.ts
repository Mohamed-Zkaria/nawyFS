import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { UserRole } from '@/modules/users/entities/user-role.enum';
import { AuthenticatedUser } from '@/modules/auth/decorators/current-user.decorator';

function createContext(user?: AuthenticatedUser): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

function createGuard(requiredRoles: UserRole[] | undefined): RolesGuard {
  const reflector = {
    getAllAndOverride: () => requiredRoles,
  } as unknown as Reflector;
  return new RolesGuard(reflector);
}

describe('RolesGuard', () => {
  it('allows any authenticated user when no @Roles() is set', () => {
    const guard = createGuard(undefined);
    const context = createContext({
      sub: '1',
      email: 'a@b.com',
      role: UserRole.NORMAL,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows an admin through an admin-only route', () => {
    const guard = createGuard([UserRole.ADMIN]);
    const context = createContext({
      sub: '1',
      email: 'a@b.com',
      role: UserRole.ADMIN,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('denies a normal user on an admin-only route', () => {
    const guard = createGuard([UserRole.ADMIN]);
    const context = createContext({
      sub: '1',
      email: 'a@b.com',
      role: UserRole.NORMAL,
    });

    expect(guard.canActivate(context)).toBe(false);
  });

  it('denies when there is no authenticated user at all', () => {
    const guard = createGuard([UserRole.ADMIN]);
    const context = createContext(undefined);

    expect(guard.canActivate(context)).toBe(false);
  });
});
