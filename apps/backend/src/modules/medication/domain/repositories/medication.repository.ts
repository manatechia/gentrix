import type { MedicationOrder } from '@gentrix/domain-medication';

export interface MedicationRepository {
  list(): Promise<MedicationOrder[]>;
  findById(id: string): Promise<MedicationOrder | null>;
  create(order: MedicationOrder): Promise<MedicationOrder>;
  update(order: MedicationOrder): Promise<MedicationOrder>;
}

export const MEDICATION_REPOSITORY = Symbol('MEDICATION_REPOSITORY');
