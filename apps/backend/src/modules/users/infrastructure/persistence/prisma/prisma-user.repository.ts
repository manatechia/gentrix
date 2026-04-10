import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  AuthRole,
  EntityStatus,
  UserOverview,
} from '@gentrix/shared-types';

import { PrismaService } from '../../../../../infrastructure/prisma/prisma.service';
import type {
  PersistedUserCreateInput,
  UserRepository,
} from '../../../domain/repositories/user.repository';

type MembershipRecord = Prisma.OrganizationMembershipGetPayload<{
  include: {
    user: true;
  };
}>;

const authRoles = new Set<AuthRole>([
  'admin',
  'nurse',
  'assistant',
  'health-director',
  'external',
]);

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async list(organizationId: string): Promise<UserOverview[]> {
    const memberships = await this.prisma.organizationMembership.findMany({
      where: {
        organizationId,
        deletedAt: null,
        roleCode: {
          not: 'admin',
        },
        user: {
          deletedAt: null,
        },
      },
      include: {
        user: true,
      },
      orderBy: {
        user: {
          fullName: 'asc',
        },
      },
    });

    return memberships.map(mapMembershipRecord);
  }

  async create(input: PersistedUserCreateInput): Promise<UserOverview> {
    const existingUser = await this.prisma.userAccount.findUnique({
      where: {
        email: input.email,
      },
    });

    if (existingUser) {
      throw new ConflictException('Ya existe un usuario con ese email.');
    }

    const now = new Date();
    const createdUser = await this.prisma.userAccount.create({
      data: {
        fullName: input.fullName,
        email: input.email,
        password: input.password,
        role: input.role,
        status: 'active',
        createdAt: now,
        createdBy: input.actor,
        updatedAt: now,
        updatedBy: input.actor,
        memberships: {
          create: {
            organizationId: input.organizationId,
            roleCode: input.role,
            status: 'active',
            isDefault: true,
            joinedAt: now,
            createdAt: now,
            createdBy: input.actor,
            updatedAt: now,
            updatedBy: input.actor,
          },
        },
      },
      include: {
        memberships: {
          where: {
            organizationId: input.organizationId,
            deletedAt: null,
          },
          include: {
            user: true,
          },
          take: 1,
        },
      },
    });

    return mapMembershipRecord(createdUser.memberships[0]);
  }
}

function mapMembershipRecord(record: MembershipRecord): UserOverview {
  return {
    id: record.user.id as UserOverview['id'],
    fullName: record.user.fullName,
    email: record.user.email,
    role: normalizeAuthRole(record.roleCode),
    status: normalizeEntityStatus(record.user.status),
  };
}

function normalizeAuthRole(value: string): AuthRole {
  if (value === 'coordinator') {
    return 'health-director';
  }

  if (value === 'staff') {
    return 'assistant';
  }

  return authRoles.has(value as AuthRole) ? (value as AuthRole) : 'assistant';
}

function normalizeEntityStatus(value: string): EntityStatus {
  return value === 'inactive' || value === 'archived' ? value : 'active';
}
