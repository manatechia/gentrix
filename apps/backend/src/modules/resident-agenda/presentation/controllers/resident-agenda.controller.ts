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
  Req,
} from '@nestjs/common';

import { getAuditActorFromRequest } from '../../../../common/auth/audit-actor';
import type { RequestWithSession } from '../../../../common/auth/session.guard';
import { ResidentAgendaService } from '../../application/resident-agenda.service';
import { CreateResidentAgendaEventDto } from '../dto/create-resident-agenda-event.dto';
import { CreateResidentAgendaSeriesDto } from '../dto/create-resident-agenda-series.dto';
import { OverrideResidentAgendaOccurrenceDto } from '../dto/override-resident-agenda-occurrence.dto';
import { UpdateResidentAgendaEventDto } from '../dto/update-resident-agenda-event.dto';
import { UpdateResidentAgendaSeriesDto } from '../dto/update-resident-agenda-series.dto';

/**
 * Agenda por residente + recurrencia.
 *
 * `/agenda` devuelve ocurrencias del día actual (en la TZ de la organización),
 * mezclando eventos one-off y series expandidas con excepciones aplicadas.
 *
 * Eventos one-off siguen usando `/agenda` para POST/PATCH/DELETE.
 * Series usan `/agenda/series`. Excepciones de una ocurrencia puntual usan
 * `/agenda/series/:id/occurrences/:YYYY-MM-DD`.
 */
@Controller('api')
export class ResidentAgendaController {
  constructor(
    @Inject(ResidentAgendaService)
    private readonly agendaService: ResidentAgendaService,
  ) {}

  // ---------- Listados (ocurrencias del día) ----------

  @Get('residents/:residentId/agenda')
  listByResidentId(
    @Param('residentId') residentId: string,
    @Req() request: RequestWithSession,
  ) {
    return this.agendaService.listOccurrencesForResidentToday(
      residentId,
      request.authSession!.activeOrganization.id,
    );
  }

  @Get('agenda/upcoming')
  listUpcomingForDashboard(@Req() request: RequestWithSession) {
    return this.agendaService.listOccurrencesForOrganizationToday(
      request.authSession!.activeOrganization.id,
    );
  }

  // ---------- Eventos one-off (compat PR #10) ----------

  @Post('residents/:residentId/agenda')
  createEvent(
    @Param('residentId') residentId: string,
    @Body() body: CreateResidentAgendaEventDto,
    @Req() request: RequestWithSession,
  ) {
    return this.agendaService.createEvent(
      residentId,
      body,
      getAuditActorFromRequest(request),
      request.authSession!.activeOrganization.id,
    );
  }

  @Patch('residents/:residentId/agenda/:eventId')
  updateEvent(
    @Param('residentId') residentId: string,
    @Param('eventId') eventId: string,
    @Body() body: UpdateResidentAgendaEventDto,
    @Req() request: RequestWithSession,
  ) {
    return this.agendaService.updateEvent(
      residentId,
      eventId,
      body,
      getAuditActorFromRequest(request),
      request.authSession!.activeOrganization.id,
    );
  }

  @Delete('residents/:residentId/agenda/:eventId')
  @HttpCode(204)
  async deleteEvent(
    @Param('residentId') residentId: string,
    @Param('eventId') eventId: string,
    @Req() request: RequestWithSession,
  ): Promise<void> {
    await this.agendaService.deleteEvent(
      residentId,
      eventId,
      getAuditActorFromRequest(request),
      request.authSession!.activeOrganization.id,
    );
  }

  // ---------- Series ----------

  @Post('residents/:residentId/agenda/series')
  createSeries(
    @Param('residentId') residentId: string,
    @Body() body: CreateResidentAgendaSeriesDto,
    @Req() request: RequestWithSession,
  ) {
    return this.agendaService.createSeries(
      residentId,
      body,
      getAuditActorFromRequest(request),
      request.authSession!.activeOrganization.id,
    );
  }

  @Patch('residents/:residentId/agenda/series/:seriesId')
  updateSeries(
    @Param('residentId') residentId: string,
    @Param('seriesId') seriesId: string,
    @Body() body: UpdateResidentAgendaSeriesDto,
    @Req() request: RequestWithSession,
  ) {
    return this.agendaService.updateSeries(
      residentId,
      seriesId,
      body,
      getAuditActorFromRequest(request),
      request.authSession!.activeOrganization.id,
    );
  }

  @Delete('residents/:residentId/agenda/series/:seriesId')
  @HttpCode(204)
  async deleteSeries(
    @Param('residentId') residentId: string,
    @Param('seriesId') seriesId: string,
    @Req() request: RequestWithSession,
  ): Promise<void> {
    await this.agendaService.deleteSeries(
      residentId,
      seriesId,
      getAuditActorFromRequest(request),
      request.authSession!.activeOrganization.id,
    );
  }

  // ---------- Excepciones de una ocurrencia puntual ----------

  @Post(
    'residents/:residentId/agenda/series/:seriesId/occurrences/:occurrenceDate/skip',
  )
  skipOccurrence(
    @Param('residentId') residentId: string,
    @Param('seriesId') seriesId: string,
    @Param('occurrenceDate') occurrenceDate: string,
    @Req() request: RequestWithSession,
  ) {
    return this.agendaService.skipOccurrence(
      residentId,
      seriesId,
      occurrenceDate,
      getAuditActorFromRequest(request),
      request.authSession!.activeOrganization.id,
    );
  }

  @Patch(
    'residents/:residentId/agenda/series/:seriesId/occurrences/:occurrenceDate',
  )
  overrideOccurrence(
    @Param('residentId') residentId: string,
    @Param('seriesId') seriesId: string,
    @Param('occurrenceDate') occurrenceDate: string,
    @Body() body: OverrideResidentAgendaOccurrenceDto,
    @Req() request: RequestWithSession,
  ) {
    return this.agendaService.overrideOccurrence(
      residentId,
      seriesId,
      occurrenceDate,
      body,
      getAuditActorFromRequest(request),
      request.authSession!.activeOrganization.id,
    );
  }

  @Delete(
    'residents/:residentId/agenda/series/:seriesId/occurrences/:occurrenceDate',
  )
  @HttpCode(204)
  async clearOccurrenceException(
    @Param('residentId') residentId: string,
    @Param('seriesId') seriesId: string,
    @Param('occurrenceDate') occurrenceDate: string,
    @Req() request: RequestWithSession,
  ): Promise<void> {
    await this.agendaService.clearOccurrenceException(
      residentId,
      seriesId,
      occurrenceDate,
      getAuditActorFromRequest(request),
      request.authSession!.activeOrganization.id,
    );
  }
}
