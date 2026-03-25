import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';

import type { RequestWithSession } from '../../../../common/auth/session.guard';
import { MedicationService } from '../../application/medication.service';
import { CreateMedicationDto } from '../dto/create-medication.dto';
import { UpdateMedicationDto } from '../dto/update-medication.dto';

@Controller('api/medications')
export class MedicationController {
  constructor(
    @Inject(MedicationService)
    private readonly medicationService: MedicationService,
  ) {}

  @Get()
  getMedications() {
    return this.medicationService.getMedications();
  }

  @Get('catalog')
  getMedicationCatalog() {
    return this.medicationService.getMedicationCatalog();
  }

  @Get(':medicationId')
  getMedicationById(@Param('medicationId') medicationId: string) {
    return this.medicationService.getMedicationById(medicationId);
  }

  @Post()
  createMedication(
    @Body() body: CreateMedicationDto,
    @Req() request: RequestWithSession,
  ) {
    return this.medicationService.createMedication(
      body,
      request.authSession!.user.email,
    );
  }

  @Put(':medicationId')
  updateMedication(
    @Param('medicationId') medicationId: string,
    @Body() body: UpdateMedicationDto,
    @Req() request: RequestWithSession,
  ) {
    return this.medicationService.updateMedication(
      medicationId,
      body,
      request.authSession!.user.email,
    );
  }
}
