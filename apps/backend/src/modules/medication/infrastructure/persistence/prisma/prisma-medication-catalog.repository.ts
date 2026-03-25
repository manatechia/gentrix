import { Inject, Injectable } from '@nestjs/common';

import type { EntityStatus, MedicationCatalogItem } from '@gentrix/shared-types';

import { PrismaService } from '../../../../../infrastructure/prisma/prisma.service';
import type { MedicationCatalogRepository } from '../../../domain/repositories/medication-catalog.repository';

const medicationStatuses = new Set<EntityStatus>([
  'active',
  'inactive',
  'archived',
]);

@Injectable()
export class PrismaMedicationCatalogRepository
  implements MedicationCatalogRepository
{
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async list(): Promise<MedicationCatalogItem[]> {
    const catalogItems = await this.prisma.medicationCatalogItem.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        medicationName: 'asc',
      },
    });

    return catalogItems.map(mapMedicationCatalogItemRecord);
  }

  async findById(id: string): Promise<MedicationCatalogItem | null> {
    const catalogItem = await this.prisma.medicationCatalogItem.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    return catalogItem ? mapMedicationCatalogItemRecord(catalogItem) : null;
  }
}

function mapMedicationCatalogItemRecord(record: {
  id: string;
  medicationName: string;
  activeIngredient: string | null;
  status: string;
}): MedicationCatalogItem {
  return {
    id: record.id as MedicationCatalogItem['id'],
    medicationName: record.medicationName,
    activeIngredient: record.activeIngredient ?? undefined,
    status: medicationStatuses.has(record.status as EntityStatus)
      ? (record.status as EntityStatus)
      : 'active',
  };
}
