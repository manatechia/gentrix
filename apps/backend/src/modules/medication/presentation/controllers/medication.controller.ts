import { Controller, Get, Inject } from '@nestjs/common';

import { MedicationService } from '../../application/medication.service';

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
}
