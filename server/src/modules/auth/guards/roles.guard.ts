import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '@/modules/auth/decorators/roles.decorator';
import { AuthenticatedUser } from '@/modules/auth/decorators/current-user.decorator';
import { UserRole } from '@/modules/users/entities/user-role.enum';

// Global, registered after JwtAuthGuard (global guards run in registration
// order) — by the time this runs, request.user is populated if the route
// isn't @Public(). No @Roles() means no restriction.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser | undefined;
    return !!user && requiredRoles.includes(user.role);
  }
}
