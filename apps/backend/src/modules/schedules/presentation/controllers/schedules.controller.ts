import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';

import { getAuditActorFromRequest } from '../../../../common/auth/audit-actor';
import { assertCanManageStaffSchedules } from '../../../../common/auth/role-access';
import type { RequestWithSession } from '../../../../common/auth/session.guard';
import { SchedulesService } from '../../application/schedules.service';
import { CreateUserScheduleDto } from '../dto/create-user-schedule.dto';
import { UpdateUserScheduleDto } from '../dto/update-user-schedule.dto';

@Controller('api/users')
export class SchedulesController {
  constructor(
    @Inject(SchedulesService)
    private readonly schedulesService: SchedulesService,
  ) {}

  @Get(':userId/schedules')
  listByUserId(
    @Param('userId') userId: string,
    @Req() request: RequestWithSession,
  ) {
    return this.schedulesService.listByUserId(
      userId,
      request.authSession!.activeOrganization.id,
    );
  }

  @Post(':userId/schedules')
  create(
    @Param('userId') userId: string,
    @Body() body: CreateUserScheduleDto,
    @Req() request: RequestWithSession,
  ) {
    assertCanManageStaffSchedules(request.authSession!.user.role);
    return this.schedulesService.create(
      userId,
      body,
      getAuditActorFromRequest(request),
      request.authSession!.activeOrganization.id,
    );
  }

  @Put('schedules/:scheduleId')
  update(
    @Param('scheduleId') scheduleId: string,
    @Body() body: UpdateUserScheduleDto,
    @Req() request: RequestWithSession,
  ) {
    assertCanManageStaffSchedules(request.authSession!.user.role);
    return this.schedulesService.update(
      scheduleId,
      body,
      getAuditActorFromRequest(request),
      request.authSession!.activeOrganization.id,
    );
  }
}
