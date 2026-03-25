import { Module } from '@nestjs/common';

import { AuthService } from './application/auth.service';
import {
  AUTH_SESSION_REPOSITORY,
} from './domain/repositories/auth-session.repository';
import { AUTH_USER_REPOSITORY } from './domain/repositories/auth-user.repository';
import { PrismaAuthSessionRepository } from './infrastructure/persistence/prisma/prisma-auth-session.repository';
import { PrismaAuthUserRepository } from './infrastructure/persistence/prisma/prisma-auth-user.repository';
import { AuthController } from './presentation/controllers/auth.controller';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: AUTH_USER_REPOSITORY,
      useClass: PrismaAuthUserRepository,
    },
    {
      provide: AUTH_SESSION_REPOSITORY,
      useClass: PrismaAuthSessionRepository,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
