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
