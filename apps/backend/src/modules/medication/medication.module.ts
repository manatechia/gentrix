import { Module } from '@nestjs/common';

import { ResidentsModule } from '../residents/residents.module';
import { MedicationService } from './application/medication.service';
import { MEDICATION_REPOSITORY } from './domain/repositories/medication.repository';
import { InMemoryMedicationRepository } from './infrastructure/persistence/in-memory/in-memory-medication.repository';
import { MedicationController } from './presentation/controllers/medication.controller';

@Module({
  imports: [ResidentsModule],
  controllers: [MedicationController],
  providers: [
    MedicationService,
    {
      provide: MEDICATION_REPOSITORY,
      useClass: InMemoryMedicationRepository,
    },
  ],
  exports: [MedicationService, MEDICATION_REPOSITORY],
})
export class MedicationModule {}
