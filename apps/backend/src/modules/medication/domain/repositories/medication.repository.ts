import type { MedicationOrder } from '@gentrix/domain-medication';

export interface MedicationRepository {
  list(organizationId?: string): Promise<MedicationOrder[]>;
  listByResidentId(
    residentId: MedicationOrder['residentId'],
    organizationId?: MedicationOrder['organizationId'],
  ): Promise<MedicationOrder[]>;
  findById(id: string, organizationId?: string): Promise<MedicationOrder | null>;
  create(order: MedicationOrder): Promise<MedicationOrder>;
  update(order: MedicationOrder): Promise<MedicationOrder>;
}

export const MEDICATION_REPOSITORY = Symbol('MEDICATION_REPOSITORY');
