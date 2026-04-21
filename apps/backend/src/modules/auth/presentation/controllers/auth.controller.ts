import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { getAuditActorFromRequest } from '../../../../common/auth/audit-actor';
import { AllowDuringForcedChange } from '../../../../common/auth/force-password-change.guard';
import { Public } from '../../../../common/auth/public.decorator';
import type { RequestWithSession } from '../../../../common/auth/session.guard';
import { AuthService } from '../../application/auth.service';
import { LoginDto } from '../dto/login.dto';

@Controller('api/auth')
export class AuthController {
  constructor(
    @Inject(AuthService)
    private readonly authService: AuthService,
  ) {}

  @Public()
  // 10 intentos de login por minuto por IP. Freno anti brute-force; si alguien
  // legítimo se quedó afuera, sigue teniendo la ventana siguiente.
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @AllowDuringForcedChange()
  @Get('session')
  getSession(@Req() request: RequestWithSession) {
    return {
      user: request.authSession!.user,
      activeOrganization: request.authSession!.activeOrganization,
      activeFacility: request.authSession!.activeFacility,
      expiresAt: request.authSession!.expiresAt,
    };
  }

  @AllowDuringForcedChange()
  @Post('logout')
  logout(@Req() request: RequestWithSession) {
    return this.authService.logout(request.authSession!.token, getAuditActorFromRequest(request));
  }
}
