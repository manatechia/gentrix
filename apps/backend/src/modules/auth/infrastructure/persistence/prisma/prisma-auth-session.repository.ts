import { Inject, Injectable } from '@nestjs/common';

import type { AuthRole } from '@gentrix/shared-types';
import { toIsoDateString } from '@gentrix/shared-utils';

import { PrismaService } from '../../../../../infrastructure/prisma/prisma.service';
import type {
  AuthSessionRepository,
  AuthSessionWithToken,
} from '../../../domain/repositories/auth-session.repository';

const authRoles = new Set<AuthRole>(['admin', 'coordinator', 'staff']);

@Injectable()
export class PrismaAuthSessionRepository implements AuthSessionRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async create(session: AuthSessionWithToken): Promise<void> {
    const createdAt = new Date();

    await this.prisma.authSession.create({
      data: {
        token: session.token,
        userId: session.user.id,
        activeOrganizationId: session.activeOrganization.id,
        activeFacilityId: session.activeFacility?.id ?? null,
        expiresAt: new Date(session.expiresAt),
        lastSeenAt: createdAt,
        createdAt,
        createdBy: session.user.email,
        updatedAt: createdAt,
        updatedBy: session.user.email,
      },
    });
  }

  async findValidByToken(token: string): Promise<AuthSessionWithToken | null> {
    const session = await this.prisma.authSession.findFirst({
      where: {
        token,
        deletedAt: null,
        expiresAt: {
          gt: new Date(),
        },
        user: {
          deletedAt: null,
          status: 'active',
        },
        activeOrganization: {
          deletedAt: null,
          status: 'active',
        },
      },
      include: {
        user: true,
        activeOrganization: true,
        activeFacility: true,
      },
    });

    if (!session) {
      return null;
    }

    const membership = await this.prisma.organizationMembership.findFirst({
      where: {
        userId: session.userId,
        organizationId: session.activeOrganizationId,
        status: 'active',
        deletedAt: null,
      },
      orderBy: [{ isDefault: 'desc' }, { joinedAt: 'asc' }],
    });

    if (!membership || !authRoles.has(membership.roleCode as AuthRole)) {
      return null;
    }

    return {
      token: session.token,
      user: {
        id: session.user.id as AuthSessionWithToken['user']['id'],
        fullName: session.user.fullName,
        email: session.user.email,
        role: membership.roleCode as AuthRole,
      },
      activeOrganization: {
        id: session.activeOrganization
          .id as AuthSessionWithToken['activeOrganization']['id'],
        slug: session.activeOrganization.slug,
        displayName: session.activeOrganization.displayName,
      },
      activeFacility: session.activeFacility
        ? {
            id: session.activeFacility.id as NonNullable<
              AuthSessionWithToken['activeFacility']
            >['id'],
            code: session.activeFacility.code,
            name: session.activeFacility.name,
          }
        : undefined,
      expiresAt: toIsoDateString(session.expiresAt),
    };
  }

  async delete(token: string, actor: string): Promise<boolean> {
    const updatedAt = new Date();
    const result = await this.prisma.authSession.updateMany({
      where: {
        token,
        deletedAt: null,
      },
      data: {
        deletedAt: updatedAt,
        deletedBy: actor,
        updatedAt,
        updatedBy: actor,
      },
    });

    return result.count > 0;
  }
}
