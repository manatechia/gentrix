import type { MedicationCatalogItem } from '@gentrix/shared-types';

export interface MedicationCatalogRepository {
  list(): Promise<MedicationCatalogItem[]>;
  findById(id: string): Promise<MedicationCatalogItem | null>;
}

export const MEDICATION_CATALOG_REPOSITORY = Symbol(
  'MEDICATION_CATALOG_REPOSITORY',
);
