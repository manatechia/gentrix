import { Module } from '@nestjs/common';

import { UsersModule } from '../users/users.module';
import { SchedulesService } from './application/schedules.service';
import {
  SCHEDULE_REPOSITORY,
} from './domain/repositories/schedule.repository';
import { PrismaScheduleRepository } from './infrastructure/persistence/prisma/prisma-schedule.repository';
import { SchedulesController } from './presentation/controllers/schedules.controller';

@Module({
  imports: [UsersModule],
  controllers: [SchedulesController],
  providers: [
    SchedulesService,
    {
      provide: SCHEDULE_REPOSITORY,
      useClass: PrismaScheduleRepository,
    },
  ],
  exports: [SchedulesService, SCHEDULE_REPOSITORY],
})
export class SchedulesModule {}
