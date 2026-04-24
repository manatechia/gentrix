import { Module } from '@nestjs/common';

import { MedicationModule } from '../medication/medication.module';
import { ResidentsModule } from '../residents/residents.module';
import { UsersModule } from '../users/users.module';
import { SystemService } from './application/system.service';
import { ClientErrorsController } from './presentation/controllers/client-errors.controller';
import { SystemController } from './presentation/controllers/system.controller';

@Module({
  imports: [ResidentsModule, UsersModule, MedicationModule],
  controllers: [SystemController, ClientErrorsController],
  providers: [SystemService],
})
export class SystemModule {}
