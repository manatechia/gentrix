import {
  Body,
  Controller,
  Get,
  Inject,
  UnauthorizedException,
  Param,
  Patch,
  Post,
  Put,
  Req,
} from '@nestjs/common';

import { getAuditActorFromRequest } from '../../../../common/auth/audit-actor';
import {
  assertCanManageResidentRecords,
  assertCanRecordResidentObservations,
} from '../../../../common/auth/role-access';
import type { RequestWithSession } from '../../../../common/auth/session.guard';
import { ResidentLiveProfileQueryService } from '../../application/resident-live-profile.query.service';
import { ResidentsService } from '../../application/residents.service';
import { CreateResidentDto } from '../dto/create-resident.dto';
import { UpdateResidentCareStatusDto } from '../dto/update-resident-care-status.dto';
import { UpdateResidentDto } from '../dto/update-resident.dto';

@Controller('api/residents')
export class ResidentsController {
  constructor(
    @Inject(ResidentsService)
    private readonly residentsService: ResidentsService,
    @Inject(ResidentLiveProfileQueryService)
    private readonly residentLiveProfileQuery: ResidentLiveProfileQueryService,
  ) {}

  @Get()
  getResidents(@Req() request: RequestWithSession) {
    return this.residentsService.getResidents(
      request.authSession!.activeOrganization.id,
    );
  }

  /**
   * Listado consumido por el widget del dashboard. Devuelve solo los residentes
   * que actualmente están en observación dentro de la organización activa.
   */
  @Get('under-observation')
  getResidentsUnderObservation(@Req() request: RequestWithSession) {
    return this.residentsService.getResidentsByCareStatus(
      'en_observacion',
      request.authSession!.activeOrganization.id,
    );
  }

  @Get(':residentId')
  getResidentById(
    @Param('residentId') residentId: string,
    @Req() request: RequestWithSession,
  ) {
    return this.residentsService.getResidentById(
      residentId,
      request.authSession!.activeOrganization.id,
    );
  }

  @Get(':residentId/live-profile')
  getResidentLiveProfile(
    @Param('residentId') residentId: string,
    @Req() request: RequestWithSession,
  ) {
    return this.residentLiveProfileQuery.getResidentLiveProfile(
      residentId,
      request.authSession!.activeOrganization.id,
    );
  }

  @Post()
  createResident(
    @Body() body: CreateResidentDto,
    @Req() request: RequestWithSession,
  ) {
    assertCanManageResidentRecords(request.authSession!.user.role);
    const activeFacility = request.authSession!.activeFacility;

    if (!activeFacility) {
      throw new UnauthorizedException(
        'No hay una residencia activa seleccionada para esta sesion.',
      );
    }

    return this.residentsService.createResident(
      body,
      getAuditActorFromRequest(request),
      request.authSession!.activeOrganization.id,
      activeFacility.id,
    );
  }

  @Put(':residentId')
  updateResident(
    @Param('residentId') residentId: string,
    @Body() body: UpdateResidentDto,
    @Req() request: RequestWithSession,
  ) {
    assertCanManageResidentRecords(request.authSession!.user.role);
    return this.residentsService.updateResident(
      residentId,
      body,
      getAuditActorFromRequest(request),
      request.authSession!.activeOrganization.id,
    );
  }

  /**
   * Transiciona el `careStatus` del residente (hoy: normal ↔ en_observacion).
   *
   * Habilitado para todo el equipo que puede registrar observaciones
   * (admin, director de salud, enfermería, asistentes): los mismos roles
   * que pueden poner a un residente en observación a través de la nota
   * rápida también pueden quitarlo desde su ficha, sin tener que pedirle
   * al admin que libere el estado.
   */
  @Patch(':residentId/care-status')
  updateResidentCareStatus(
    @Param('residentId') residentId: string,
    @Body() body: UpdateResidentCareStatusDto,
    @Req() request: RequestWithSession,
  ) {
    assertCanRecordResidentObservations(request.authSession!.user.role);
    return this.residentsService.setResidentCareStatus(
      residentId,
      body.toStatus,
      getAuditActorFromRequest(request),
      request.authSession!.activeOrganization.id,
    );
  }
}
