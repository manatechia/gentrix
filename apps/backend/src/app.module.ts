import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

// NOTE: nestjs-pino's `@InjectPinoLogger(ctx)` registers `ctx` in an internal
// Set at decoration time (when the class file loads), and `LoggerModule.forRoot`
// snapshots that Set to build providers for `PinoLogger:ctx` tokens. If
// LoggerModule is imported before the feature modules whose services use
// `@InjectPinoLogger`, those contexts aren't in the Set yet and DI fails with
// `Nest can't resolve dependencies ... "PinoLogger:<ServiceName>"`.
// Keep LoggerModule below the feature-module imports so every decorator runs
// first. ApiExceptionFilter is already imported above and also benefits.
import { ApiExceptionFilter } from './common/http/api-exception.filter';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { MedicationModule } from './modules/medication/medication.module';
import { ResidentAgendaModule } from './modules/resident-agenda/resident-agenda.module';
import { ResidentObservationNotesModule } from './modules/resident-observation-notes/resident-observation-notes.module';
import { ResidentsModule } from './modules/residents/residents.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { StaffModule } from './modules/staff/staff.module';
import { SystemModule } from './modules/system/system.module';
import { UsersModule } from './modules/users/users.module';
import { LoggerModule } from './common/logger/logger.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    LoggerModule,
    // Rate limit global: techo de 120 req/min por IP. Endpoints sensibles
    // (login, reset, change-password) bajan ese techo con @Throttle() local.
    // TTL en ms (formato v6).
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 120 },
    ]),
    PrismaModule,
    AuthModule,
    ResidentsModule,
    ResidentAgendaModule,
    ResidentObservationNotesModule,
    StaffModule,
    SchedulesModule,
    MedicationModule,
    SystemModule,
    UsersModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
