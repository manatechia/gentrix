import { Inject, Injectable } from '@nestjs/common';

import type {
  AuthFacility,
  AuthOrganization,
  AuthRole,
} from '@gentrix/shared-types';

import { PrismaService } from '../../../../../infrastructure/prisma/prisma.service';
import type {
  AuthUserRepository,
  StoredAuthUser,
} from '../../../domain/repositories/auth-user.repository';

const authRoles = new Set<AuthRole>([
  'admin',
  'nurse',
  'assistant',
  'health-director',
  'external',
]);

@Injectable()
export class PrismaAuthUserRepository implements AuthUserRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async findByEmail(email: string): Promise<StoredAuthUser | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.userAccount.findFirst({
      where: {
        email: normalizedEmail,
        deletedAt: null,
        // Users in an inactive state must not be able to authenticate, even
        // when they still have a forced password-change flag set.
        status: 'active',
      },
      include: {
        memberships: {
          where: {
            deletedAt: null,
            status: 'active',
          },
          orderBy: [{ isDefault: 'desc' }, { joinedAt: 'asc' }],
          include: {
            role: true,
            organization: {
              include: {
                facilities: {
                  where: {
                    deletedAt: null,
                    status: 'active',
                  },
                  orderBy: {
                    name: 'asc',
                  },
                },
              },
            },
            facilityScopes: {
              include: {
                facility: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    const activeMembership = user.memberships.find(
      (membership) => membership.organization.deletedAt === null,
    );

    if (!activeMembership) {
      return null;
    }

    const normalizedRole = normalizeAuthRole(activeMembership.role.code);

    if (!normalizedRole) {
      return null;
    }

    const activeOrganization: AuthOrganization = {
      id: activeMembership.organization.id as AuthOrganization['id'],
      slug: activeMembership.organization.slug,
      displayName: activeMembership.organization.displayName,
    };
    const scopedFacility = activeMembership.facilityScopes.find(
      (scope) =>
        scope.facility.deletedAt === null && scope.facility.status === 'active',
    )?.facility;
    const fallbackFacility = activeMembership.organization.facilities[0];
    const activeFacilityRecord = scopedFacility ?? fallbackFacility;
    const activeFacility = activeFacilityRecord
      ? ({
          id: activeFacilityRecord.id as AuthFacility['id'],
          code: activeFacilityRecord.code,
          name: activeFacilityRecord.name,
        } satisfies AuthFacility)
      : undefined;

    return {
      id: user.id as StoredAuthUser['id'],
      fullName: user.fullName,
      email: user.email,
      password: user.password,
      role: normalizedRole,
      forcePasswordChange: user.forcePasswordChange,
      activeOrganization,
      activeFacility,
    };
  }

  async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.userAccount.update({
      where: { id: userId },
      data: {
        password: passwordHash,
        // Intentionally does NOT touch passwordChangedAt / forcePasswordChange:
        // this is a storage-format migration, not a user-visible change.
        updatedAt: new Date(),
        updatedBy: 'system:password-hash-migration',
      },
    });
  }
}

function normalizeAuthRole(value: string): AuthRole | null {
  return authRoles.has(value as AuthRole) ? (value as AuthRole) : null;
}
