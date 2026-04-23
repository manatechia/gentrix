import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';

import { getAuditActorFromRequest } from '../../../../common/auth/audit-actor';
import { assertCanManageUsers } from '../../../../common/auth/role-access';
import type { RequestWithSession } from '../../../../common/auth/session.guard';
import { WorkedHoursService } from '../../application/worked-hours.service';
import { CreateHourlyRateDto } from '../dto/create-hourly-rate.dto';
import { UpdateHourlyRateDto } from '../dto/update-hourly-rate.dto';

@Controller('api/users')
export class HourlyRatesController {
  constructor(
    @Inject(WorkedHoursService)
    private readonly workedHours: WorkedHoursService,
  ) {}

  @Get(':userId/hourly-rates')
  list(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Req() request: RequestWithSession,
  ) {
    assertCanManageUsers(request.authSession!.user.role);
    return this.workedHours.listHourlyRates(
      userId,
      request.authSession!.activeOrganization.id,
    );
  }

  @Post(':userId/hourly-rates')
  create(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() body: CreateHourlyRateDto,
    @Req() request: RequestWithSession,
  ) {
    assertCanManageUsers(request.authSession!.user.role);
    return this.workedHours.createHourlyRate(
      userId,
      body,
      getAuditActorFromRequest(request),
      request.authSession!.activeOrganization.id,
    );
  }

  @Patch('hourly-rates/:rateId')
  update(
    @Param('rateId', new ParseUUIDPipe()) rateId: string,
    @Body() body: UpdateHourlyRateDto,
    @Req() request: RequestWithSession,
  ) {
    assertCanManageUsers(request.authSession!.user.role);
    return this.workedHours.updateHourlyRate(
      rateId,
      body,
      getAuditActorFromRequest(request),
      request.authSession!.activeOrganization.id,
    );
  }
}
