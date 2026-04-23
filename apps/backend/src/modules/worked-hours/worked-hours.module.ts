import { Module } from '@nestjs/common';

import { UsersModule } from '../users/users.module';
import { WorkedHoursService } from './application/worked-hours.service';
import { HOUR_SETTLEMENT_REPOSITORY } from './domain/repositories/hour-settlement.repository';
import { HOURLY_RATE_REPOSITORY } from './domain/repositories/hourly-rate.repository';
import { WORKED_HOUR_ENTRY_REPOSITORY } from './domain/repositories/worked-hour-entry.repository';
import { PrismaHourSettlementRepository } from './infrastructure/persistence/prisma/prisma-hour-settlement.repository';
import { PrismaHourlyRateRepository } from './infrastructure/persistence/prisma/prisma-hourly-rate.repository';
import { PrismaWorkedHourEntryRepository } from './infrastructure/persistence/prisma/prisma-worked-hour-entry.repository';
import { HourlyRatesController } from './presentation/controllers/hourly-rates.controller';
import { SettlementsController } from './presentation/controllers/settlements.controller';
import { WorkedHourEntriesController } from './presentation/controllers/worked-hour-entries.controller';

@Module({
  imports: [UsersModule],
  controllers: [
    HourlyRatesController,
    WorkedHourEntriesController,
    SettlementsController,
  ],
  providers: [
    WorkedHoursService,
    {
      provide: HOURLY_RATE_REPOSITORY,
      useClass: PrismaHourlyRateRepository,
    },
    {
      provide: WORKED_HOUR_ENTRY_REPOSITORY,
      useClass: PrismaWorkedHourEntryRepository,
    },
    {
      provide: HOUR_SETTLEMENT_REPOSITORY,
      useClass: PrismaHourSettlementRepository,
    },
  ],
  exports: [WorkedHoursService],
})
export class WorkedHoursModule {}
