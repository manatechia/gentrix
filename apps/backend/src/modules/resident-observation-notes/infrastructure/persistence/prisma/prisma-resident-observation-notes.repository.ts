import { Inject, Injectable } from '@nestjs/common';

import type {
  EntityId,
  ResidentObservationNote,
} from '@gentrix/shared-types';
import { createRandomEntityId, toIsoDateString } from '@gentrix/shared-utils';

import { PrismaService } from '../../../../../infrastructure/prisma/prisma.service';
import type { ResidentObservationNotesRepository } from '../../../domain/repositories/resident-observation-notes.repository';

type ObservationNoteRow = {
  id: string;
  organizationId: string;
  facilityId: string | null;
  residentId: string;
  note: string;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  deletedAt: Date | null;
  deletedBy: string | null;
};

@Injectable()
export class PrismaResidentObservationNotesRepository
  implements ResidentObservationNotesRepository
{
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async listByResidentId(
    residentId: EntityId,
    organizationId: EntityId,
  ): Promise<ResidentObservationNote[]> {
    // TODO: agregar limit/cursor si aparece algún residente con >200
    // observaciones. Por ahora traemos todo y el frontend pagina en render.
    const rows = (await this.prisma.residentObservationNote.findMany({
      where: {
        residentId,
        organizationId,
        deletedAt: null,
      },
      orderBy: [{ createdAt: 'desc' }],
    })) as ObservationNoteRow[];

    return rows.map(mapRowToObservationNote);
  }

  async findById(
    id: EntityId,
    organizationId: EntityId,
  ): Promise<ResidentObservationNote | null> {
    const row = (await this.prisma.residentObservationNote.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
    })) as ObservationNoteRow | null;

    return row ? mapRowToObservationNote(row) : null;
  }

  async create(
    residentId: EntityId,
    input: { note: string },
    actor: string,
  ): Promise<ResidentObservationNote> {
    const resident = await this.prisma.resident.findFirstOrThrow({
      where: {
        id: residentId,
        deletedAt: null,
      },
      select: {
        organizationId: true,
        facilityId: true,
      },
    });

    const now = new Date();
    const created = (await this.prisma.residentObservationNote.create({
      data: {
        id: createRandomEntityId(),
        organizationId: resident.organizationId,
        facilityId: resident.facilityId,
        residentId,
        note: input.note,
        createdAt: now,
        createdBy: actor,
        updatedAt: now,
        updatedBy: actor,
      },
    })) as ObservationNoteRow;

    return mapRowToObservationNote(created);
  }

  async softDelete(
    id: EntityId,
    actor: string,
    organizationId: EntityId,
  ): Promise<void> {
    const now = new Date();
    const result = await this.prisma.residentObservationNote.updateMany({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      data: {
        deletedAt: now,
        deletedBy: actor,
        updatedAt: now,
        updatedBy: actor,
      },
    });

    if (result.count === 0) {
      throw new Error(`ResidentObservationNote ${id} not found.`);
    }
  }
}

function mapRowToObservationNote(
  row: ObservationNoteRow,
): ResidentObservationNote {
  return {
    id: row.id as ResidentObservationNote['id'],
    residentId: row.residentId as ResidentObservationNote['residentId'],
    note: row.note,
    audit: {
      createdAt: toIsoDateString(row.createdAt),
      createdBy: row.createdBy,
      updatedAt: toIsoDateString(row.updatedAt),
      updatedBy: row.updatedBy,
      deletedAt: row.deletedAt ? toIsoDateString(row.deletedAt) : undefined,
      deletedBy: row.deletedBy ?? undefined,
    },
  };
}
