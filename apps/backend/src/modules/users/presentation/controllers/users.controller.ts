import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { buildAuditActorLabel, getAuditActorFromRequest } from '../../../../common/auth/audit-actor';
import { AllowDuringForcedChange } from '../../../../common/auth/force-password-change.guard';
import { assertCanManageUsers } from '../../../../common/auth/role-access';
import type { RequestWithSession } from '../../../../common/auth/session.guard';
import { UsersService } from '../../application/users.service';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { CreateUserDto } from '../dto/create-user.dto';

@Controller('api/users')
export class UsersController {
  constructor(
    @Inject(UsersService)
    private readonly usersService: UsersService,
  ) {}

  @Get()
  getUsers(@Req() request: RequestWithSession) {
    assertCanManageUsers(request.authSession!.user.role);
    return this.usersService.getUsers(request.authSession!.activeOrganization.id);
  }

  // Listado del equipo operativo para la org activa. Lo consume la shell
  // (dashboard, horarios), así que cualquier usuario autenticado de la org
  // puede verlo: reemplaza al viejo `GET /api/staff`.
  @Get('team')
  getTeam(@Req() request: RequestWithSession) {
    return this.usersService.getTeam(
      request.authSession!.activeOrganization.id,
    );
  }

  @Post()
  createUser(
    @Body() body: CreateUserDto,
    @Req() request: RequestWithSession,
  ) {
    assertCanManageUsers(request.authSession!.user.role);
    return this.usersService.createUser(
      body,
      getAuditActorFromRequest(request),
      request.authSession!.activeOrganization.id,
    );
  }

  // Reset administrativo: 20 req/min por IP (margen para operaciones masivas
  // de un admin sin dejar abierto a fuerza bruta sobre IDs).
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @Post(':userId/reset-password')
  resetPassword(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Req() request: RequestWithSession,
  ) {
    assertCanManageUsers(request.authSession!.user.role);
    const session = request.authSession!;
    return this.usersService.resetPassword(userId, {
      userId: session.user.id,
      label: buildAuditActorLabel(session.user),
      organizationId: session.activeOrganization.id,
      ipAddress: getRequestIp(request),
      userAgent: getUserAgent(request),
    });
  }

  // Cambio de contraseña propio: 10 req/min por IP para frenar brute-force
  // sobre la "currentPassword" durante un forced-change.
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @AllowDuringForcedChange()
  @Post('me/change-password')
  async changeOwnPassword(
    @Body() body: ChangePasswordDto,
    @Req() request: RequestWithSession,
  ) {
    const session = request.authSession!;

    await this.usersService.completeForcedChange(
      {
        userId: session.user.id,
        label: buildAuditActorLabel(session.user),
        organizationId: session.activeOrganization.id,
        ipAddress: getRequestIp(request),
        userAgent: getUserAgent(request),
      },
      body.currentPassword,
      body.newPassword,
      body.confirmPassword,
    );

    return { success: true };
  }
}

function getRequestIp(request: RequestWithSession): string | null {
  const raw = request as unknown as {
    ip?: string;
    socket?: { remoteAddress?: string };
  };
  return raw.ip ?? raw.socket?.remoteAddress ?? null;
}

function getUserAgent(request: RequestWithSession): string | null {
  const headers = request.headers as Record<string, string | undefined>;
  return headers['user-agent'] ?? null;
}
