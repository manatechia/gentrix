import type {
  MedicationCreateInput,
  MedicationDetail,
  MedicationUpdateInput,
} from '@gentrix/shared-types';

import { toMedicationFormValues } from '../constants/medication-intake';
import type { MedicationFormValues } from '../types/medication-form-values';

function toMedicationIsoDate(value: string): string {
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

export function toMedicationUpsertInput(
  values: MedicationFormValues,
): MedicationCreateInput | MedicationUpdateInput {
  return {
    medicationCatalogId:
      values.medicationCatalogId as MedicationCreateInput['medicationCatalogId'],
    residentId: values.residentId as MedicationCreateInput['residentId'],
    dose: values.dose.trim(),
    route: values.route,
    frequency: values.frequency,
    scheduleTimes: values.scheduleTimes
      .map((entry) => entry.value.trim())
      .filter(Boolean),
    prescribedBy: values.prescribedBy.trim(),
    startDate: toMedicationIsoDate(values.startDate),
    endDate: values.endDate ? toMedicationIsoDate(values.endDate) : undefined,
    status: values.status,
  };
}

export function toMedicationEditFormValues(
  medication: MedicationDetail,
): MedicationFormValues {
  return toMedicationFormValues(medication);
}
