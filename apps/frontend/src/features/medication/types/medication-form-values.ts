import type {
  EntityStatus,
  MedicationFrequency,
  MedicationRoute,
} from '@gentrix/shared-types';

export interface MedicationScheduleTimeFormValue {
  localId: string;
  value: string;
}

export interface MedicationFormValues {
  residentId: string;
  medicationCatalogId: string;
  dose: string;
  route: MedicationRoute;
  frequency: MedicationFrequency;
  scheduleTimes: MedicationScheduleTimeFormValue[];
  prescribedBy: string;
  startDate: string;
  endDate: string;
  status: EntityStatus;
}
