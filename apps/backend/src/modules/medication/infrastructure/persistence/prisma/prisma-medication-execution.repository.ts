import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  isMedicationExecutionResult,
  type MedicationExecution,
} from '@gentrix/domain-medication';
import { toIsoDateString } from '@gentrix/shared-utils';

import { PrismaService } from '../../../../../infrastructure/prisma/prisma.service';
import type { MedicationExecutionRepository } from '../../../domain/repositories/medication-execution.repository';

type MedicationExecutionRecord =
  Prisma.MedicationExecutionGetPayload<Record<string, never>>;

@Injectable()
export class PrismaMedicationExecutionRepository
  implements MedicationExecutionRepository
{
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async list(
    organizationId?: MedicationExecution['organizationId'],
  ): Promise<MedicationExecution[]> {
    const executions = await this.prisma.medicationExecution.findMany({
      where: {
        deletedAt: null,
        organizationId: organizationId ?? undefined,
      },
      orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
    });

    return executions.map(mapMedicationExecutionRecord);
  }

  async listByMedicationOrderId(
    medicationOrderId: MedicationExecution['medicationOrderId'],
    organizationId?: MedicationExecution['organizationId'],
  ): Promise<MedicationExecution[]> {
    const executions = await this.prisma.medicationExecution.findMany({
      where: {
        medicationOrderId,
        deletedAt: null,
        organizationId: organizationId ?? undefined,
      },
      orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
    });

    return executions.map(mapMedicationExecutionRecord);
  }

  async listByResidentId(
    residentId: MedicationExecution['residentId'],
    organizationId?: MedicationExecution['organizationId'],
  ): Promise<MedicationExecution[]> {
    const executions = await this.prisma.medicationExecution.findMany({
      where: {
        residentId,
        deletedAt: null,
        organizationId: organizationId ?? undefined,
      },
      orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
    });

    return executions.map(mapMedicationExecutionRecord);
  }

  async create(execution: MedicationExecution): Promise<MedicationExecution> {
    const created = await this.prisma.medicationExecution.create({
      data: {
        id: execution.id,
        organizationId: execution.organizationId,
        facilityId: execution.facilityId,
        medicationOrderId: execution.medicationOrderId,
        residentId: execution.residentId,
        medicationName: execution.medicationName,
        result: execution.result,
        occurredAt: new Date(execution.occurredAt),
        createdAt: new Date(execution.audit.createdAt),
        createdBy: execution.audit.createdBy,
        updatedAt: new Date(execution.audit.updatedAt),
        updatedBy: execution.audit.updatedBy,
        deletedAt: execution.audit.deletedAt
          ? new Date(execution.audit.deletedAt)
          : null,
        deletedBy: execution.audit.deletedBy ?? null,
      },
    });

    return mapMedicationExecutionRecord(created);
  }
}

function mapMedicationExecutionRecord(
  record: MedicationExecutionRecord,
): MedicationExecution {
  return {
    id: record.id as MedicationExecution['id'],
    organizationId:
      record.organizationId as MedicationExecution['organizationId'],
    facilityId: record.facilityId as MedicationExecution['facilityId'],
    medicationOrderId:
      record.medicationOrderId as MedicationExecution['medicationOrderId'],
    residentId: record.residentId as MedicationExecution['residentId'],
    medicationName: record.medicationName,
    result: isMedicationExecutionResult(record.result)
      ? record.result
      : 'administered',
    occurredAt: toIsoDateString(record.occurredAt),
    audit: {
      createdAt: toIsoDateString(record.createdAt),
      updatedAt: toIsoDateString(record.updatedAt),
      createdBy: record.createdBy,
      updatedBy: record.updatedBy,
      deletedAt: record.deletedAt
        ? toIsoDateString(record.deletedAt)
        : undefined,
      deletedBy: record.deletedBy ?? undefined,
    },
  };
}
