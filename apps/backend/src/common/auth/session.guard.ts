import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AuthService } from '../../modules/auth/application/auth.service';
import { PUBLIC_ROUTE_KEY } from './public.decorator';
import type { AuthSessionWithToken } from '../../modules/auth/domain/repositories/auth-session.repository';

export interface RequestWithSession {
  headers: {
    authorization?: string;
  };
  authSession?: AuthSessionWithToken;
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithSession>();
    const authorization = request.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Unauthorized.');
    }

    const token = authorization.slice('Bearer '.length).trim();

    if (!token) {
      throw new UnauthorizedException('Unauthorized.');
    }

    const session = await this.authService.validateSessionToken(token);

    if (!session) {
      throw new UnauthorizedException('Unauthorized.');
    }

    request.authSession = session;
    return true;
  }
}
