import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  EntityId,
  IsoDateString,
  MembershipHourlyRate,
} from '@gentrix/shared-types';
import { createRandomEntityId, toIsoDateString } from '@gentrix/shared-utils';

import { PrismaService } from '../../../../../infrastructure/prisma/prisma.service';
import type {
  HourlyRateCreateRecord,
  HourlyRateRepository,
  HourlyRateUpdateRecord,
} from '../../../domain/repositories/hourly-rate.repository';

type HourlyRateRecord = Prisma.MembershipHourlyRateGetPayload<{
  include: {
    membership: {
      include: { user: true };
    };
  };
}>;

const hourlyRateInclude = {
  membership: {
    include: { user: true },
  },
} as const;

@Injectable()
export class PrismaHourlyRateRepository implements HourlyRateRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async listByMembership(
    membershipId: EntityId,
  ): Promise<MembershipHourlyRate[]> {
    const rows = await this.prisma.membershipHourlyRate.findMany({
      where: { membershipId, deletedAt: null },
      include: hourlyRateInclude,
      orderBy: [{ effectiveFrom: 'desc' }],
    });
    return rows.map(mapRecord);
  }

  async findById(id: EntityId): Promise<MembershipHourlyRate | null> {
    const row = await this.prisma.membershipHourlyRate.findFirst({
      where: { id, deletedAt: null },
      include: hourlyRateInclude,
    });
    return row ? mapRecord(row) : null;
  }

  async findApplicable(
    membershipId: EntityId,
    workDate: Date,
  ): Promise<MembershipHourlyRate | null> {
    const row = await this.prisma.membershipHourlyRate.findFirst({
      where: {
        membershipId,
        deletedAt: null,
        effectiveFrom: { lte: workDate },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: workDate } }],
      },
      include: hourlyRateInclude,
      orderBy: { effectiveFrom: 'desc' },
    });
    return row ? mapRecord(row) : null;
  }

  async create(input: HourlyRateCreateRecord): Promise<MembershipHourlyRate> {
    const now = new Date();
    const row = await this.prisma.membershipHourlyRate.create({
      data: {
        id: createRandomEntityId(),
        membershipId: input.membershipId,
        rate: input.rate,
        currency: input.currency,
        effectiveFrom: input.effectiveFrom,
        effectiveTo: null,
        createdAt: now,
        createdBy: input.actor,
        updatedAt: now,
        updatedBy: input.actor,
      },
      include: hourlyRateInclude,
    });
    return mapRecord(row);
  }

  async closePrevious(
    membershipId: EntityId,
    beforeDate: Date,
    actor: string,
  ): Promise<void> {
    await this.prisma.membershipHourlyRate.updateMany({
      where: {
        membershipId,
        deletedAt: null,
        effectiveTo: null,
        effectiveFrom: { lt: beforeDate },
      },
      data: {
        effectiveTo: beforeDate,
        updatedAt: new Date(),
        updatedBy: actor,
      },
    });
  }

  async update(
    id: EntityId,
    input: HourlyRateUpdateRecord,
  ): Promise<MembershipHourlyRate> {
    const row = await this.prisma.membershipHourlyRate.update({
      where: { id },
      data: {
        ...(input.rate !== undefined && { rate: input.rate }),
        ...(input.currency !== undefined && { currency: input.currency }),
        ...(input.effectiveFrom !== undefined && {
          effectiveFrom: input.effectiveFrom,
        }),
        ...(input.effectiveTo !== undefined && {
          effectiveTo: input.effectiveTo,
        }),
        updatedAt: new Date(),
        updatedBy: input.actor,
      },
      include: hourlyRateInclude,
    });
    return mapRecord(row);
  }
}

function mapRecord(record: HourlyRateRecord): MembershipHourlyRate {
  return {
    id: record.id as MembershipHourlyRate['id'],
    userId: record.membership.user.id as MembershipHourlyRate['userId'],
    rate: record.rate.toFixed(2),
    currency: record.currency,
    effectiveFrom: toIsoDateString(record.effectiveFrom) as IsoDateString,
    effectiveTo: record.effectiveTo
      ? (toIsoDateString(record.effectiveTo) as IsoDateString)
      : null,
    audit: {
      createdAt: toIsoDateString(record.createdAt),
      updatedAt: toIsoDateString(record.updatedAt),
      createdBy: record.createdBy,
      updatedBy: record.updatedBy,
      deletedAt: record.deletedAt ? toIsoDateString(record.deletedAt) : undefined,
      deletedBy: record.deletedBy ?? undefined,
    },
  };
}
