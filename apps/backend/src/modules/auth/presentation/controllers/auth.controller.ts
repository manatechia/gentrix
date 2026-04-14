import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
} from '@nestjs/common';

import { getAuditActorFromRequest } from '../../../../common/auth/audit-actor';
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
  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Get('session')
  getSession(@Req() request: RequestWithSession) {
    return {
      user: request.authSession!.user,
      activeOrganization: request.authSession!.activeOrganization,
      activeFacility: request.authSession!.activeFacility,
      expiresAt: request.authSession!.expiresAt,
    };
  }

  @Post('logout')
  logout(@Req() request: RequestWithSession) {
    return this.authService.logout(request.authSession!.token, getAuditActorFromRequest(request));
  }
}
