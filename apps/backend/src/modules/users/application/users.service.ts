import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type { UserCreateInput, UserOverview } from '@gentrix/shared-types';

import {
  USER_REPOSITORY,
  type UserRepository,
} from '../domain/repositories/user.repository';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepository,
  ) {}

  async getUsers(organizationId: string): Promise<UserOverview[]> {
    return this.users.list(organizationId);
  }

  async createUser(
    input: UserCreateInput,
    actor: string,
    organizationId: string,
  ): Promise<UserOverview> {
    const fullName = input.fullName.trim();
    const password = input.password.trim();
    const email = input.email.trim().toLowerCase();

    if (!fullName) {
      throw new BadRequestException('El nombre completo es obligatorio.');
    }

    if (!password) {
      throw new BadRequestException('La contrasena es obligatoria.');
    }

    try {
      return await this.users.create({
        ...input,
        fullName,
        password,
        email,
        actor,
        organizationId,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Ya existe un usuario con ese email.');
      }

      throw error;
    }
  }
}
