import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  EntityId,
  HourSettlement,
  HourSettlementDetail,
  HourSettlementLine,
  HourSettlementStatus,
  IsoDateString,
} from '@gentrix/shared-types';
import { createRandomEntityId, toIsoDateString } from '@gentrix/shared-utils';

import { PrismaService } from '../../../../../infrastructure/prisma/prisma.service';
import type {
  HourSettlementRepository,
  SettlementEntryFreeze,
  SettlementIssueRecord,
} from '../../../domain/repositories/hour-settlement.repository';

type SettlementRecord = Prisma.HourSettlementGetPayload<{
  include: {
    membership: { include: { user: true } };
  };
}>;

type SettlementDetailRecord = Prisma.HourSettlementGetPayload<{
  include: {
    membership: { include: { user: true } };
    entries: {
      include: {
        membership: { include: { user: true } };
      };
    };
  };
}>;

const settlementInclude = {
  membership: { include: { user: true } },
} as const;

const settlementDetailInclude = {
  membership: { include: { user: true } },
  entries: {
    include: { membership: { include: { user: true } } },
  },
} as const;

@Injectable()
export class PrismaHourSettlementRepository
  implements HourSettlementRepository
{
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async listByMembership(membershipId: EntityId): Promise<HourSettlement[]> {
    const rows = await this.prisma.hourSettlement.findMany({
      where: { membershipId, deletedAt: null },
      include: settlementInclude,
      orderBy: [{ periodStart: 'desc' }],
    });
    return rows.map(mapSettlement);
  }

  async findById(id: EntityId): Promise<HourSettlement | null> {
    const row = await this.prisma.hourSettlement.findFirst({
      where: { id, deletedAt: null },
      include: settlementInclude,
    });
    return row ? mapSettlement(row) : null;
  }

  async findDetailById(id: EntityId): Promise<HourSettlementDetail | null> {
    const row = await this.prisma.hourSettlement.findFirst({
      where: { id, deletedAt: null },
      include: settlementDetailInclude,
    });
    return row ? mapDetail(row) : null;
  }

  async findOverlappingActive(
    membershipId: EntityId,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<HourSettlement | null> {
    const row = await this.prisma.hourSettlement.findFirst({
      where: {
        membershipId,
        deletedAt: null,
        cancelledAt: null,
        AND: [
          { periodStart: { lte: periodEnd } },
          { periodEnd: { gte: periodStart } },
        ],
      },
      include: settlementInclude,
    });
    return row ? mapSettlement(row) : null;
  }

  async issue(
    input: SettlementIssueRecord,
    frozenEntries: SettlementEntryFreeze[],
  ): Promise<HourSettlementDetail> {
    const now = new Date();
    const id = createRandomEntityId();
    const created = await this.prisma.$transaction(async (tx) => {
      const settlement = await tx.hourSettlement.create({
        data: {
          id,
          membershipId: input.membershipId,
          periodStart: input.periodStart,
          periodEnd: input.periodEnd,
          issuedAt: now,
          notes: input.notes ?? null,
          createdAt: now,
          createdBy: input.actor,
          updatedAt: now,
          updatedBy: input.actor,
        },
      });

      for (const frozen of frozenEntries) {
        await tx.workedHourEntry.update({
          where: { id: frozen.entryId },
          data: {
            settlementId: settlement.id,
            appliedRate: frozen.appliedRate,
            appliedCurrency: frozen.appliedCurrency,
            updatedAt: now,
            updatedBy: input.actor,
          },
        });
      }

      return settlement;
    });

    const detail = await this.findDetailById(
      created.id as HourSettlementDetail['id'],
    );
    if (!detail) {
      throw new NotFoundException('La liquidación recién creada no se pudo leer.');
    }
    return detail;
  }

  async markPaid(id: EntityId, actor: string): Promise<HourSettlementDetail> {
    const now = new Date();
    await this.prisma.hourSettlement.update({
      where: { id },
      data: {
        paidAt: now,
        updatedAt: now,
        updatedBy: actor,
      },
    });
    const detail = await this.findDetailById(id);
    if (!detail) {
      throw new NotFoundException('No encontré la liquidación.');
    }
    return detail;
  }

  async cancel(id: EntityId, actor: string): Promise<HourSettlementDetail> {
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.workedHourEntry.updateMany({
        where: { settlementId: id, deletedAt: null },
        data: {
          settlementId: null,
          appliedRate: null,
          appliedCurrency: null,
          updatedAt: now,
          updatedBy: actor,
        },
      });
      await tx.hourSettlement.update({
        where: { id },
        data: {
          cancelledAt: now,
          paidAt: null,
          updatedAt: now,
          updatedBy: actor,
        },
      });
    });
    const detail = await this.findDetailById(id);
    if (!detail) {
      throw new NotFoundException('No encontré la liquidación tras cancelarla.');
    }
    return detail;
  }
}

function deriveStatus(
  record: Pick<SettlementRecord, 'paidAt' | 'cancelledAt'>,
): HourSettlementStatus {
  if (record.cancelledAt) return 'cancelled';
  if (record.paidAt) return 'paid';
  return 'issued';
}

function mapSettlement(record: SettlementRecord): HourSettlement {
  return {
    id: record.id as HourSettlement['id'],
    userId: record.membership.user.id as HourSettlement['userId'],
    periodStart: toIsoDateString(record.periodStart) as IsoDateString,
    periodEnd: toIsoDateString(record.periodEnd) as IsoDateString,
    issuedAt: toIsoDateString(record.issuedAt),
    paidAt: record.paidAt ? toIsoDateString(record.paidAt) : null,
    cancelledAt: record.cancelledAt
      ? toIsoDateString(record.cancelledAt)
      : null,
    status: deriveStatus(record),
    notes: record.notes ?? undefined,
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

function mapDetail(record: SettlementDetailRecord): HourSettlementDetail {
  const base = mapSettlement(record);
  const lines: HourSettlementLine[] = record.entries
    .filter((entry) => entry.deletedAt === null)
    .map((entry) => {
      const hours = entry.hours.toFixed(2);
      const rate = entry.appliedRate?.toFixed(2) ?? '0.00';
      const currency = entry.appliedCurrency ?? '';
      const subtotal = (
        Number.parseFloat(hours) * Number.parseFloat(rate)
      ).toFixed(2);
      return {
        entryId: entry.id as HourSettlementLine['entryId'],
        workDate: toIsoDateString(entry.workDate) as IsoDateString,
        hours,
        appliedRate: rate,
        appliedCurrency: currency,
        subtotal,
        notes: entry.notes ?? undefined,
      };
    })
    .sort((a, b) => a.workDate.localeCompare(b.workDate));

  const totalHours = lines
    .reduce((acc, line) => acc + Number.parseFloat(line.hours), 0)
    .toFixed(2);
  const totalAmount = lines
    .reduce((acc, line) => acc + Number.parseFloat(line.subtotal), 0)
    .toFixed(2);
  const currency = lines[0]?.appliedCurrency ?? '';

  return {
    ...base,
    lines,
    totalHours,
    totalAmount,
    currency,
  };
}
