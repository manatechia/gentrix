import { Module } from '@nestjs/common';

import { MedicationModule } from '../medication/medication.module';
import { ResidentsModule } from '../residents/residents.module';
import { StaffModule } from '../staff/staff.module';
import { SystemService } from './application/system.service';
import { SystemController } from './presentation/controllers/system.controller';

@Module({
  imports: [ResidentsModule, StaffModule, MedicationModule],
  controllers: [SystemController],
  providers: [SystemService],
})
export class SystemModule {}
