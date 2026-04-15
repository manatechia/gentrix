import { Module } from '@nestjs/common';

import { ResidentsModule } from '../residents/residents.module';
import { ResidentObservationNotesService } from './application/resident-observation-notes.service';
import { RESIDENT_OBSERVATION_NOTES_REPOSITORY } from './domain/repositories/resident-observation-notes.repository';
import { PrismaResidentObservationNotesRepository } from './infrastructure/persistence/prisma/prisma-resident-observation-notes.repository';
import { ResidentObservationNotesController } from './presentation/controllers/resident-observation-notes.controller';

@Module({
  imports: [ResidentsModule],
  controllers: [ResidentObservationNotesController],
  providers: [
    ResidentObservationNotesService,
    {
      provide: RESIDENT_OBSERVATION_NOTES_REPOSITORY,
      useClass: PrismaResidentObservationNotesRepository,
    },
  ],
  exports: [ResidentObservationNotesService],
})
export class ResidentObservationNotesModule {}
