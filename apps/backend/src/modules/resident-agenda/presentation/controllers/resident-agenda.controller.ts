import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';

import { getAuditActorFromRequest } from '../../../../common/auth/audit-actor';
import type { RequestWithSession } from '../../../../common/auth/session.guard';
import { ResidentAgendaService } from '../../application/resident-agenda.service';
import { CreateResidentAgendaEventDto } from '../dto/create-resident-agenda-event.dto';
import { UpdateResidentAgendaEventDto } from '../dto/update-resident-agenda-event.dto';

/**
 * Agenda por residente (SDD RF-04/RF-05):
 *  - `/api/residents/:residentId/agenda`: próximos eventos del residente y
 *    operaciones CRUD asociadas.
 *  - `/api/agenda/upcoming`: próximos eventos de toda la organización activa
 *    para alimentar el bloque "Próximas tareas" del dashboard.
 */
@Controller('api')
export class ResidentAgendaController {
  constructor(
    @Inject(ResidentAgendaService)
    private readonly agendaService: ResidentAgendaService,
  ) {}

  @Get('residents/:residentId/agenda')
  listByResidentId(
    @Param('residentId') residentId: string,
    @Req() request: RequestWithSession,
  ) {
    return this.agendaService.listUpcomingByResidentId(
      residentId,
      request.authSession!.activeOrganization.id,
    );
  }

  @Post('residents/:residentId/agenda')
  create(
    @Param('residentId') residentId: string,
    @Body() body: CreateResidentAgendaEventDto,
    @Req() request: RequestWithSession,
  ) {
    return this.agendaService.create(
      residentId,
      body,
      getAuditActorFromRequest(request),
      request.authSession!.activeOrganization.id,
    );
  }

  @Patch('residents/:residentId/agenda/:eventId')
  update(
    @Param('residentId') residentId: string,
    @Param('eventId') eventId: string,
    @Body() body: UpdateResidentAgendaEventDto,
    @Req() request: RequestWithSession,
  ) {
    return this.agendaService.update(
      residentId,
      eventId,
      body,
      getAuditActorFromRequest(request),
      request.authSession!.activeOrganization.id,
    );
  }

  @Delete('residents/:residentId/agenda/:eventId')
  @HttpCode(204)
  async delete(
    @Param('residentId') residentId: string,
    @Param('eventId') eventId: string,
    @Req() request: RequestWithSession,
  ): Promise<void> {
    await this.agendaService.delete(
      residentId,
      eventId,
      getAuditActorFromRequest(request),
      request.authSession!.activeOrganization.id,
    );
  }

  @Get('agenda/upcoming')
  listUpcomingForDashboard(
    @Req() request: RequestWithSession,
    @Query('limit') limit?: string,
  ) {
    return this.agendaService.listUpcomingByOrganization(
      request.authSession!.activeOrganization.id,
      limit ? Number.parseInt(limit, 10) : 20,
    );
  }
}
