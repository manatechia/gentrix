import { Module } from '@nestjs/common';

import { UsersService } from './application/users.service';
import { PASSWORD_RESET_AUDIT_REPOSITORY } from './domain/repositories/password-reset-audit.repository';
import { USER_REPOSITORY } from './domain/repositories/user.repository';
import { PrismaPasswordResetAuditRepository } from './infrastructure/persistence/prisma/prisma-password-reset-audit.repository';
import { PrismaUserRepository } from './infrastructure/persistence/prisma/prisma-user.repository';
import { UsersController } from './presentation/controllers/users.controller';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: PASSWORD_RESET_AUDIT_REPOSITORY,
      useClass: PrismaPasswordResetAuditRepository,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
