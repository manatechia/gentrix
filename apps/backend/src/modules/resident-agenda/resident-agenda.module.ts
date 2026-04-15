import { Module } from '@nestjs/common';

import { ResidentsModule } from '../residents/residents.module';
import { ResidentAgendaService } from './application/resident-agenda.service';
import { RESIDENT_AGENDA_REPOSITORY } from './domain/repositories/resident-agenda.repository';
import { PrismaResidentAgendaRepository } from './infrastructure/persistence/prisma/prisma-resident-agenda.repository';
import { ResidentAgendaController } from './presentation/controllers/resident-agenda.controller';

@Module({
  imports: [ResidentsModule],
  controllers: [ResidentAgendaController],
  providers: [
    ResidentAgendaService,
    {
      provide: RESIDENT_AGENDA_REPOSITORY,
      useClass: PrismaResidentAgendaRepository,
    },
  ],
  exports: [ResidentAgendaService],
})
export class ResidentAgendaModule {}
