import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './modules/auth/auth.module';
import { MedicationModule } from './modules/medication/medication.module';
import { ResidentsModule } from './modules/residents/residents.module';
import { StaffModule } from './modules/staff/staff.module';
import { SystemModule } from './modules/system/system.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    AuthModule,
    ResidentsModule,
    StaffModule,
    MedicationModule,
    SystemModule,
  ],
})
export class AppModule {}
