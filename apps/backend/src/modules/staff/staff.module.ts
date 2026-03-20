import { Module } from '@nestjs/common';

import { StaffService } from './application/staff.service';
import { STAFF_REPOSITORY } from './domain/repositories/staff.repository';
import { InMemoryStaffRepository } from './infrastructure/persistence/in-memory/in-memory-staff.repository';
import { StaffController } from './presentation/controllers/staff.controller';

@Module({
  controllers: [StaffController],
  providers: [
    StaffService,
    {
      provide: STAFF_REPOSITORY,
      useClass: InMemoryStaffRepository,
    },
  ],
  exports: [StaffService, STAFF_REPOSITORY],
})
export class StaffModule {}
