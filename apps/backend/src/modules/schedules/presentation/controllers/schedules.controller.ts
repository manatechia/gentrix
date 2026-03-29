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

import { assertCanManageStaffSchedules } from '../../../../common/auth/role-access';
import type { RequestWithSession } from '../../../../common/auth/session.guard';
import { SchedulesService } from '../../application/schedules.service';
import { CreateStaffScheduleDto } from '../dto/create-staff-schedule.dto';
import { UpdateStaffScheduleDto } from '../dto/update-staff-schedule.dto';

@Controller('api/staff')
export class SchedulesController {
  constructor(
    @Inject(SchedulesService)
    private readonly schedulesService: SchedulesService,
  ) {}

  @Get(':staffId/schedules')
  listByStaffId(@Param('staffId') staffId: string) {
    return this.schedulesService.listByStaffId(staffId);
  }

  @Post(':staffId/schedules')
  create(
    @Param('staffId') staffId: string,
    @Body() body: CreateStaffScheduleDto,
    @Req() request: RequestWithSession,
  ) {
    assertCanManageStaffSchedules(request.authSession!.user.role);
    return this.schedulesService.create(
      staffId,
      body,
      request.authSession!.user.email,
    );
  }

  @Put('schedules/:scheduleId')
  update(
    @Param('scheduleId') scheduleId: string,
    @Body() body: UpdateStaffScheduleDto,
    @Req() request: RequestWithSession,
  ) {
    assertCanManageStaffSchedules(request.authSession!.user.role);
    return this.schedulesService.update(
      scheduleId,
      body,
      request.authSession!.user.email,
    );
  }
}
