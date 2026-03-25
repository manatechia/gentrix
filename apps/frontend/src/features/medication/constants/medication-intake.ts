import type { MedicationDetail } from '@gentrix/shared-types';

import type { SelectFieldOption } from '../../../shared/ui/select-field';
import type {
  MedicationFormValues,
  MedicationScheduleTimeFormValue,
} from '../types/medication-form-values';

function createLocalId(prefix: string): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100_000)}`;
}

export function createMedicationScheduleTime(
  value = '',
): MedicationScheduleTimeFormValue {
  return {
    localId: createLocalId('medication-time'),
    value,
  };
}

export const medicationRouteOptions: ReadonlyArray<SelectFieldOption> = [
  { value: 'oral', label: 'Oral' },
  { value: 'intravenous', label: 'Intravenosa' },
  { value: 'subcutaneous', label: 'Subcutanea' },
  { value: 'topical', label: 'Topica' },
];

export const medicationFrequencyOptions: ReadonlyArray<SelectFieldOption> = [
  { value: 'daily', label: 'A diario' },
  { value: 'twice-daily', label: 'Dos veces al dia' },
  { value: 'nightly', label: 'Por la noche' },
  { value: 'as-needed', label: 'Segun necesidad' },
];

export const medicationStatusOptions: ReadonlyArray<SelectFieldOption> = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'archived', label: 'Archivado' },
];

export function createMedicationFormInitialValues(
  referenceDate: Date = new Date(),
): MedicationFormValues {
  return {
    residentId: '',
    medicationCatalogId: '',
    dose: '',
    route: 'oral',
    frequency: 'daily',
    scheduleTimes: [createMedicationScheduleTime()],
    prescribedBy: '',
    startDate: referenceDate.toISOString().slice(0, 10),
    endDate: '',
    status: 'active',
  };
}

export function toMedicationFormValues(
  medication: MedicationDetail,
): MedicationFormValues {
  return {
    residentId: medication.residentId,
    medicationCatalogId: medication.medicationCatalogId,
    dose: medication.dose,
    route: medication.route,
    frequency: medication.frequency,
    scheduleTimes: medication.scheduleTimes.length
      ? medication.scheduleTimes.map((time) => createMedicationScheduleTime(time))
      : [createMedicationScheduleTime()],
    prescribedBy: medication.prescribedBy,
    startDate: medication.startDate.slice(0, 10),
    endDate: medication.endDate?.slice(0, 10) ?? '',
    status: medication.status,
  };
}
