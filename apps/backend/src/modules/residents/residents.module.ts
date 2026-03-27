import { Module } from '@nestjs/common';

import { PrismaMedicationRepository } from '../medication/infrastructure/persistence/prisma/prisma-medication.repository';
import { MEDICATION_REPOSITORY } from '../medication/domain/repositories/medication.repository';
import { ResidentLiveProfileQueryService } from './application/resident-live-profile.query.service';
import { ResidentsService } from './application/residents.service';
import {
  RESIDENT_REPOSITORY,
} from './domain/repositories/resident.repository';
import { PrismaResidentRepository } from './infrastructure/persistence/prisma/prisma-resident.repository';
import { ResidentsController } from './presentation/controllers/residents.controller';

@Module({
  controllers: [ResidentsController],
  providers: [
    ResidentsService,
    ResidentLiveProfileQueryService,
    {
      provide: RESIDENT_REPOSITORY,
      useClass: PrismaResidentRepository,
    },
    {
      provide: MEDICATION_REPOSITORY,
      useClass: PrismaMedicationRepository,
    },
  ],
  exports: [ResidentsService, RESIDENT_REPOSITORY],
})
export class ResidentsModule {}
