import type { MedicationOrder } from '@gentrix/domain-medication';

export interface MedicationRepository {
  list(): Promise<MedicationOrder[]>;
}

export const MEDICATION_REPOSITORY = Symbol('MEDICATION_REPOSITORY');
