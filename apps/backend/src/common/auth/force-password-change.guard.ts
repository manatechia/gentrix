import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PUBLIC_ROUTE_KEY } from './public.decorator';
import type { RequestWithSession } from './session.guard';

export const FORCE_PASSWORD_CHANGE_ALLOWED_KEY = Symbol(
  'FORCE_PASSWORD_CHANGE_ALLOWED',
);

/**
 * Route-level opt-in marker for endpoints that MUST remain reachable while a
 * user is in the forced-password-change state (session, logout, change
 * password). Everything else is blocked by ForcePasswordChangeGuard so a
 * compromised or just-reset user cannot touch the rest of the API until they
 * pick a new password.
 */
export const AllowDuringForcedChange = (): ClassDecorator & MethodDecorator =>
  ((target: object, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(
        FORCE_PASSWORD_CHANGE_ALLOWED_KEY,
        true,
        descriptor.value,
      );
      return descriptor;
    }
    Reflect.defineMetadata(FORCE_PASSWORD_CHANGE_ALLOWED_KEY, true, target);
    return target;
  }) as ClassDecorator & MethodDecorator;

@Injectable()
export class ForcePasswordChangeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const isAllowed = this.reflector.getAllAndOverride<boolean>(
      FORCE_PASSWORD_CHANGE_ALLOWED_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isAllowed) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithSession>();
    const session = request.authSession;

    if (session?.user.forcePasswordChange) {
      throw new ForbiddenException(
        'Debés cambiar tu contraseña antes de continuar.',
      );
    }

    return true;
  }
}
