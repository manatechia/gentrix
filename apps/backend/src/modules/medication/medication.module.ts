import { Module } from '@nestjs/common';

import { ResidentsModule } from '../residents/residents.module';
import { MedicationService } from './application/medication.service';
import { MEDICATION_CATALOG_REPOSITORY } from './domain/repositories/medication-catalog.repository';
import { MEDICATION_REPOSITORY } from './domain/repositories/medication.repository';
import { PrismaMedicationCatalogRepository } from './infrastructure/persistence/prisma/prisma-medication-catalog.repository';
import { PrismaMedicationRepository } from './infrastructure/persistence/prisma/prisma-medication.repository';
import { MedicationController } from './presentation/controllers/medication.controller';

@Module({
  imports: [ResidentsModule],
  controllers: [MedicationController],
  providers: [
    MedicationService,
    {
      provide: MEDICATION_CATALOG_REPOSITORY,
      useClass: PrismaMedicationCatalogRepository,
    },
    {
      provide: MEDICATION_REPOSITORY,
      useClass: PrismaMedicationRepository,
    },
  ],
  exports: [
    MedicationService,
    MEDICATION_CATALOG_REPOSITORY,
    MEDICATION_REPOSITORY,
  ],
})
export class MedicationModule {}
