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

import { getAuditActorFromRequest } from '../../../../common/auth/audit-actor';
import { assertCanManageUsers } from '../../../../common/auth/role-access';
import type { RequestWithSession } from '../../../../common/auth/session.guard';
import { WorkedHoursService } from '../../application/worked-hours.service';
import {
  SettlementIssueDto,
  SettlementPeriodDto,
} from '../dto/settlement-period.dto';

@Controller('api')
export class SettlementsController {
  constructor(
    @Inject(WorkedHoursService)
    private readonly workedHours: WorkedHoursService,
  ) {}

  @Post('users/:userId/settlements/preview')
  preview(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() body: SettlementPeriodDto,
    @Req() request: RequestWithSession,
  ) {
    assertCanManageUsers(request.authSession!.user.role);
    return this.workedHours.previewSettlement(
      userId,
      body,
      request.authSession!.activeOrganization.id,
    );
  }

  @Post('users/:userId/settlements')
  issue(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() body: SettlementIssueDto,
    @Req() request: RequestWithSession,
  ) {
    assertCanManageUsers(request.authSession!.user.role);
    return this.workedHours.issueSettlement(
      userId,
      body,
      getAuditActorFromRequest(request),
      request.authSession!.activeOrganization.id,
    );
  }

  @Get('users/:userId/settlements')
  listByUser(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Req() request: RequestWithSession,
  ) {
    assertCanManageUsers(request.authSession!.user.role);
    return this.workedHours.listSettlements(
      userId,
      request.authSession!.activeOrganization.id,
    );
  }

  @Get('settlements/:settlementId')
  getDetail(
    @Param('settlementId', new ParseUUIDPipe()) settlementId: string,
    @Req() request: RequestWithSession,
  ) {
    assertCanManageUsers(request.authSession!.user.role);
    return this.workedHours.getSettlementDetail(
      settlementId,
      request.authSession!.activeOrganization.id,
    );
  }

  @Post('settlements/:settlementId/mark-paid')
  markPaid(
    @Param('settlementId', new ParseUUIDPipe()) settlementId: string,
    @Req() request: RequestWithSession,
  ) {
    assertCanManageUsers(request.authSession!.user.role);
    return this.workedHours.markSettlementPaid(
      settlementId,
      getAuditActorFromRequest(request),
      request.authSession!.activeOrganization.id,
    );
  }

  @Post('settlements/:settlementId/cancel')
  cancel(
    @Param('settlementId', new ParseUUIDPipe()) settlementId: string,
    @Req() request: RequestWithSession,
  ) {
    assertCanManageUsers(request.authSession!.user.role);
    return this.workedHours.cancelSettlement(
      settlementId,
      getAuditActorFromRequest(request),
      request.authSession!.activeOrganization.id,
    );
  }
}
