import { Body, Controller, Get, Inject, Param, Post, Req } from '@nestjs/common';

import { getAuditActorFromRequest } from '../../../../common/auth/audit-actor';
import type { RequestWithSession } from '../../../../common/auth/session.guard';
import { ClinicalHistoryService } from '../../application/clinical-history.service';
import { CreateClinicalHistoryEventDto } from '../dto/create-clinical-history-event.dto';

@Controller('api/residents/:residentId/clinical-history')
export class ClinicalHistoryController {
  constructor(
    @Inject(ClinicalHistoryService)
    private readonly clinicalHistoryService: ClinicalHistoryService,
  ) {}

  @Get()
  listByResidentId(@Param('residentId') residentId: string) {
    return this.clinicalHistoryService.listByResidentId(residentId);
  }

  @Post()
  create(
    @Param('residentId') residentId: string,
    @Body() body: CreateClinicalHistoryEventDto,
    @Req() request: RequestWithSession,
  ) {
    // El service devuelve { event, careStatus }. La envolvente API agrega
    // `data`, así que el frontend recibe `data.event` y `data.careStatus`.
    return this.clinicalHistoryService.create(
      residentId,
      body,
      getAuditActorFromRequest(request),
    );
  }
}
