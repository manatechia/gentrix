import { Module } from '@nestjs/common';

import { AuthService } from './application/auth.service';
import {
  AUTH_SESSION_REPOSITORY,
} from './domain/repositories/auth-session.repository';
import { AUTH_USER_REPOSITORY } from './domain/repositories/auth-user.repository';
import { InMemoryAuthSessionRepository } from './infrastructure/persistence/in-memory/in-memory-auth-session.repository';
import { InMemoryAuthUserRepository } from './infrastructure/persistence/in-memory/in-memory-auth-user.repository';
import { AuthController } from './presentation/controllers/auth.controller';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: AUTH_USER_REPOSITORY,
      useClass: InMemoryAuthUserRepository,
    },
    {
      provide: AUTH_SESSION_REPOSITORY,
      useClass: InMemoryAuthSessionRepository,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
