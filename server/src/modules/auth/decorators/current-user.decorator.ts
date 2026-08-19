import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '@/modules/users/entities/user-role.enum';

export interface AuthenticatedUser {
  sub: string;
  email: string;
  role: UserRole;
}

// Controllers read the authenticated user via this decorator, never via
// req.user directly.
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user as AuthenticatedUser;
  },
);
