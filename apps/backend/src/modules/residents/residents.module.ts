import { Module } from '@nestjs/common';

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
    {
      provide: RESIDENT_REPOSITORY,
      useClass: PrismaResidentRepository,
    },
  ],
  exports: [ResidentsService, RESIDENT_REPOSITORY],
})
export class ResidentsModule {}
