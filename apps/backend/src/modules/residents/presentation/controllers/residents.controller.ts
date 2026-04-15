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
import { assertCanManageResidentRecords } from '../../../../common/auth/role-access';
import type { RequestWithSession } from '../../../../common/auth/session.guard';
import { ResidentLiveProfileQueryService } from '../../application/resident-live-profile.query.service';
import { ResidentsService } from '../../application/residents.service';
import { CreateResidentObservationEntryDto } from '../dto/create-resident-observation-entry.dto';
import { CreateResidentObservationDto } from '../dto/create-resident-observation.dto';
import { CreateResidentDto } from '../dto/create-resident.dto';
import { CreateResidentEventDto } from '../dto/create-resident-event.dto';
import { ResolveResidentObservationDto } from '../dto/resolve-resident-observation.dto';
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

  @Get(':residentId/events')
  getResidentEvents(
    @Param('residentId') residentId: string,
    @Req() request: RequestWithSession,
  ) {
    return this.residentsService.getResidentEvents(
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

  @Patch(':residentId/care-status')
  updateResidentCareStatus(
    @Param('residentId') residentId: string,
    @Body() body: UpdateResidentCareStatusDto,
    @Req() request: RequestWithSession,
  ) {
    assertCanManageResidentRecords(request.authSession!.user.role);
    return this.residentsService.setResidentCareStatus(
      residentId,
      body.toStatus,
      getAuditActorFromRequest(request),
      request.authSession!.activeOrganization.id,
    );
  }

  @Post(':residentId/events')
  createResidentEvent(
    @Param('residentId') residentId: string,
    @Body() body: CreateResidentEventDto,
    @Req() request: RequestWithSession,
  ) {
    return this.residentsService.createResidentEvent(
      residentId,
      body,
      getAuditActorFromRequest(request),
      request.authSession!.activeOrganization.id,
    );
  }

  @Get(':residentId/observations')
  getResidentObservations(
    @Param('residentId') residentId: string,
    @Req() request: RequestWithSession,
  ) {
    return this.residentsService.getResidentObservations(
      residentId,
      request.authSession!.activeOrganization.id,
    );
  }

  @Post(':residentId/observations')
  createResidentObservation(
    @Param('residentId') residentId: string,
    @Body() body: CreateResidentObservationDto,
    @Req() request: RequestWithSession,
  ) {
    return this.residentsService.createResidentObservation(
      residentId,
      body,
      getAuditActorFromRequest(request),
      request.authSession!.activeOrganization.id,
    );
  }

  @Post(':residentId/observations/:observationId/entries')
  createResidentObservationEntry(
    @Param('residentId') residentId: string,
    @Param('observationId') observationId: string,
    @Body() body: CreateResidentObservationEntryDto,
    @Req() request: RequestWithSession,
  ) {
    return this.residentsService.createResidentObservationEntry(
      residentId,
      observationId,
      body,
      getAuditActorFromRequest(request),
      request.authSession!.activeOrganization.id,
    );
  }

  @Post(':residentId/observations/:observationId/resolve')
  resolveResidentObservation(
    @Param('residentId') residentId: string,
    @Param('observationId') observationId: string,
    @Body() body: ResolveResidentObservationDto,
    @Req() request: RequestWithSession,
  ) {
    return this.residentsService.resolveResidentObservation(
      residentId,
      observationId,
      body,
      getAuditActorFromRequest(request),
      request.authSession!.activeOrganization.id,
    );
  }
}
