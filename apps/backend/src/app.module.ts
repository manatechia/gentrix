import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClinicalHistoryModule } from './modules/clinical-history/clinical-history.module';
import { MedicationModule } from './modules/medication/medication.module';
import { ResidentsModule } from './modules/residents/residents.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { StaffModule } from './modules/staff/staff.module';
import { SystemModule } from './modules/system/system.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    AuthModule,
    ClinicalHistoryModule,
    ResidentsModule,
    StaffModule,
    SchedulesModule,
    MedicationModule,
    SystemModule,
    UsersModule,
  ],
})
export class AppModule {}
