import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Req,
} from '@nestjs/common';

import { getAuditActorFromRequest } from '../../../../common/auth/audit-actor';
import {
  assertCanManageResidentRecords,
  assertCanRecordResidentObservations,
} from '../../../../common/auth/role-access';
import type { RequestWithSession } from '../../../../common/auth/session.guard';
import { ResidentObservationNotesService } from '../../application/resident-observation-notes.service';
import { CreateResidentObservationNoteDto } from '../dto/create-resident-observation-note.dto';

@Controller('api/residents/:residentId/observations')
export class ResidentObservationNotesController {
  constructor(
    @Inject(ResidentObservationNotesService)
    private readonly service: ResidentObservationNotesService,
  ) {}

  @Get()
  list(
    @Param('residentId') residentId: string,
    @Req() request: RequestWithSession,
  ) {
    return this.service.list(
      residentId,
      request.authSession!.activeOrganization.id,
    );
  }

  @Post()
  create(
    @Param('residentId') residentId: string,
    @Body() body: CreateResidentObservationNoteDto,
    @Req() request: RequestWithSession,
  ) {
    assertCanRecordResidentObservations(request.authSession!.user.role);
    return this.service.create(
      residentId,
      body,
      getAuditActorFromRequest(request),
      request.authSession!.activeOrganization.id,
    );
  }

  @Delete(':observationId')
  @HttpCode(204)
  async delete(
    @Param('residentId') residentId: string,
    @Param('observationId') observationId: string,
    @Req() request: RequestWithSession,
  ): Promise<void> {
    assertCanManageResidentRecords(request.authSession!.user.role);
    await this.service.delete(
      residentId,
      observationId,
      getAuditActorFromRequest(request),
      request.authSession!.activeOrganization.id,
    );
  }
}
