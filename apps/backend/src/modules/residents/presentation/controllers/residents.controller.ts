import { Body, Controller, Get, Inject, Param, Post, Req } from '@nestjs/common';

import type { RequestWithSession } from '../../../../common/auth/session.guard';
import { ResidentsService } from '../../application/residents.service';
import { CreateResidentDto } from '../dto/create-resident.dto';

@Controller('api/residents')
export class ResidentsController {
  constructor(
    @Inject(ResidentsService)
    private readonly residentsService: ResidentsService,
  ) {}

  @Get()
  getResidents() {
    return this.residentsService.getResidents();
  }

  @Get(':residentId')
  getResidentById(@Param('residentId') residentId: string) {
    return this.residentsService.getResidentById(residentId);
  }

  @Post()
  createResident(
    @Body() body: CreateResidentDto,
    @Req() request: RequestWithSession,
  ) {
    return this.residentsService.createResident(body, request.authSession!.user.email);
  }
}
