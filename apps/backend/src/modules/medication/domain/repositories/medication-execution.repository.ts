import type { MedicationExecution } from '@gentrix/domain-medication';

export interface MedicationExecutionRepository {
  listByMedicationOrderId(
    medicationOrderId: MedicationExecution['medicationOrderId'],
    organizationId?: MedicationExecution['organizationId'],
  ): Promise<MedicationExecution[]>;
  listByResidentId(
    residentId: MedicationExecution['residentId'],
    organizationId?: MedicationExecution['organizationId'],
  ): Promise<MedicationExecution[]>;
  create(execution: MedicationExecution): Promise<MedicationExecution>;
}

export const MEDICATION_EXECUTION_REPOSITORY = Symbol(
  'MEDICATION_EXECUTION_REPOSITORY',
);
