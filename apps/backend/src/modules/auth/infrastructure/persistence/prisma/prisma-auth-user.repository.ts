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

const authRoles = new Set<AuthRole>(['admin', 'coordinator', 'staff']);

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

    if (
      !activeMembership ||
      !authRoles.has(activeMembership.roleCode as AuthRole)
    ) {
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
      role: activeMembership.roleCode as AuthRole,
      activeOrganization,
      activeFacility,
    };
  }
}
