import {
  Body,
  Controller,
  Get,
  Inject,
  UnauthorizedException,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';

import type { RequestWithSession } from '../../../../common/auth/session.guard';
import { ResidentLiveProfileQueryService } from '../../application/resident-live-profile.query.service';
import { ResidentsService } from '../../application/residents.service';
import { CreateResidentDto } from '../dto/create-resident.dto';
import { CreateResidentEventDto } from '../dto/create-resident-event.dto';
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
    const activeFacility = request.authSession!.activeFacility;

    if (!activeFacility) {
      throw new UnauthorizedException(
        'No hay una residencia activa seleccionada para esta sesion.',
      );
    }

    return this.residentsService.createResident(
      body,
      request.authSession!.user.email,
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
    return this.residentsService.updateResident(
      residentId,
      body,
      request.authSession!.user.email,
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
      request.authSession!.user.email,
      request.authSession!.activeOrganization.id,
    );
  }
}
