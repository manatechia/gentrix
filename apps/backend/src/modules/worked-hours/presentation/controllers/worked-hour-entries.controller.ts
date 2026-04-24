import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';

import { getAuditActorFromRequest } from '../../../../common/auth/audit-actor';
import { assertCanManageUsers } from '../../../../common/auth/role-access';
import type { RequestWithSession } from '../../../../common/auth/session.guard';
import { WorkedHoursService } from '../../application/worked-hours.service';
import { CreateWorkedHourEntryDto } from '../dto/create-worked-hour-entry.dto';
import { UpdateWorkedHourEntryDto } from '../dto/update-worked-hour-entry.dto';

@Controller('api/users')
export class WorkedHourEntriesController {
  constructor(
    @Inject(WorkedHoursService)
    private readonly workedHours: WorkedHoursService,
  ) {}

  @Get(':userId/hour-entries')
  list(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Query('settled') settled: string | undefined,
    @Req() request: RequestWithSession,
  ) {
    assertCanManageUsers(request.authSession!.user.role);
    const settledFilter =
      settled === 'true' ? true : settled === 'false' ? false : undefined;
    return this.workedHours.listEntries(
      userId,
      request.authSession!.activeOrganization.id,
      { from, to, settled: settledFilter },
    );
  }

  @Post(':userId/hour-entries')
  create(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() body: CreateWorkedHourEntryDto,
    @Req() request: RequestWithSession,
  ) {
    assertCanManageUsers(request.authSession!.user.role);
    return this.workedHours.createEntry(
      userId,
      body,
      getAuditActorFromRequest(request),
      request.authSession!.activeOrganization.id,
    );
  }

  @Patch('hour-entries/:entryId')
  update(
    @Param('entryId', new ParseUUIDPipe()) entryId: string,
    @Body() body: UpdateWorkedHourEntryDto,
    @Req() request: RequestWithSession,
  ) {
    assertCanManageUsers(request.authSession!.user.role);
    return this.workedHours.updateEntry(
      entryId,
      body,
      getAuditActorFromRequest(request),
      request.authSession!.activeOrganization.id,
    );
  }

  @Delete('hour-entries/:entryId')
  async softDelete(
    @Param('entryId', new ParseUUIDPipe()) entryId: string,
    @Req() request: RequestWithSession,
  ) {
    assertCanManageUsers(request.authSession!.user.role);
    await this.workedHours.deleteEntry(
      entryId,
      getAuditActorFromRequest(request),
      request.authSession!.activeOrganization.id,
    );
    return { success: true };
  }
}
