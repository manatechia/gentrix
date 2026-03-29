import { Module } from '@nestjs/common';

import { ResidentsModule } from '../residents/residents.module';
import { ClinicalHistoryService } from './application/clinical-history.service';
import { CLINICAL_HISTORY_REPOSITORY } from './domain/repositories/clinical-history.repository';
import { PrismaClinicalHistoryRepository } from './infrastructure/persistence/prisma/prisma-clinical-history.repository';
import { ClinicalHistoryController } from './presentation/controllers/clinical-history.controller';

@Module({
  imports: [ResidentsModule],
  controllers: [ClinicalHistoryController],
  providers: [
    ClinicalHistoryService,
    {
      provide: CLINICAL_HISTORY_REPOSITORY,
      useClass: PrismaClinicalHistoryRepository,
    },
  ],
  exports: [ClinicalHistoryService, CLINICAL_HISTORY_REPOSITORY],
})
export class ClinicalHistoryModule {}
