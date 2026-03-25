import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  isMedicationFrequency,
  isMedicationRoute,
  type MedicationOrder,
} from '@gentrix/domain-medication';
import type { EntityStatus } from '@gentrix/shared-types';
import { toIsoDateString } from '@gentrix/shared-utils';

import { PrismaService } from '../../../../../infrastructure/prisma/prisma.service';
import type { MedicationRepository } from '../../../domain/repositories/medication.repository';

type MedicationRecord = Prisma.MedicationOrderGetPayload<{}>;

const medicationStatuses = new Set<EntityStatus>([
  'active',
  'inactive',
  'archived',
]);

@Injectable()
export class PrismaMedicationRepository implements MedicationRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async list(): Promise<MedicationOrder[]> {
    const medications = await this.prisma.medicationOrder.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
    });

    return medications.map(mapMedicationRecord);
  }

  async findById(id: string): Promise<MedicationOrder | null> {
    const medication = await this.prisma.medicationOrder.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    return medication ? mapMedicationRecord(medication) : null;
  }

  async create(order: MedicationOrder): Promise<MedicationOrder> {
    const created = await this.prisma.medicationOrder.create({
      data: {
        id: order.id,
        medicationCatalogId: order.medicationCatalogId,
        residentId: order.residentId,
        ...toMedicationPersistenceData(order),
        createdAt: new Date(order.audit.createdAt),
        createdBy: order.audit.createdBy,
        updatedAt: new Date(order.audit.updatedAt),
        updatedBy: order.audit.updatedBy,
        deletedAt: order.audit.deletedAt ? new Date(order.audit.deletedAt) : null,
        deletedBy: order.audit.deletedBy ?? null,
      },
    });

    return mapMedicationRecord(created);
  }

  async update(order: MedicationOrder): Promise<MedicationOrder> {
    const updated = await this.prisma.medicationOrder.update({
      where: {
        id: order.id,
      },
      data: {
        medicationCatalogId: order.medicationCatalogId,
        residentId: order.residentId,
        ...toMedicationPersistenceData(order),
        updatedAt: new Date(order.audit.updatedAt),
        updatedBy: order.audit.updatedBy,
        deletedAt: order.audit.deletedAt ? new Date(order.audit.deletedAt) : null,
        deletedBy: order.audit.deletedBy ?? null,
      },
    });

    return mapMedicationRecord(updated);
  }
}

function mapMedicationRecord(record: MedicationRecord): MedicationOrder {
  return {
    id: record.id as MedicationOrder['id'],
    medicationCatalogId:
      record.medicationCatalogId as MedicationOrder['medicationCatalogId'],
    residentId: record.residentId as MedicationOrder['residentId'],
    medicationName: record.medicationName,
    dose: record.dose,
    route: isMedicationRoute(record.route) ? record.route : 'oral',
    frequency: isMedicationFrequency(record.frequency)
      ? record.frequency
      : 'daily',
    scheduleTimes: fromJsonStringArray(record.scheduleTimes),
    prescribedBy: record.prescribedBy,
    startDate: toIsoDateString(record.startDate),
    endDate: record.endDate ? toIsoDateString(record.endDate) : undefined,
    status: medicationStatuses.has(record.status as EntityStatus)
      ? (record.status as EntityStatus)
      : 'active',
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

function toMedicationPersistenceData(order: MedicationOrder) {
  return {
    medicationName: order.medicationName,
    dose: order.dose,
    route: order.route,
    frequency: order.frequency,
    scheduleTimes: toJsonInput(order.scheduleTimes),
    prescribedBy: order.prescribedBy,
    startDate: new Date(order.startDate),
    endDate: order.endDate ? new Date(order.endDate) : null,
    status: order.status,
  };
}

function toJsonInput(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function fromJsonStringArray(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === 'string');
}
