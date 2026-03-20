import type {
  AuditTrail,
  EntityId,
  EntityStatus,
  IsoDateString,
} from '@gentrix/shared-types';
import { createEntityId, toIsoDateString } from '@gentrix/shared-utils';

export type MedicationRoute =
  | 'oral'
  | 'intravenous'
  | 'subcutaneous'
  | 'topical';

export type MedicationFrequency =
  | 'daily'
  | 'twice-daily'
  | 'nightly'
  | 'as-needed';

export interface MedicationOrder {
  id: EntityId;
  residentId: EntityId;
  medicationName: string;
  dose: string;
  route: MedicationRoute;
  frequency: MedicationFrequency;
  scheduleTimes: string[];
  prescribedBy: string;
  startDate: IsoDateString;
  endDate?: IsoDateString;
  status: EntityStatus;
  audit: AuditTrail;
}

const baseAudit: AuditTrail = {
  createdAt: toIsoDateString('2026-01-10T09:00:00.000Z'),
  updatedAt: toIsoDateString('2026-03-15T09:00:00.000Z'),
  createdBy: 'setup-script',
  updatedBy: 'setup-script',
};

export function createMedicationSeed(
  residentId: EntityId,
  overrides: Partial<MedicationOrder> = {},
): MedicationOrder {
  const orderBase: MedicationOrder = {
    id: createEntityId('medication', `Paracetamol ${residentId} 09:00-21:00`),
    residentId,
    medicationName: 'Paracetamol',
    dose: '500 mg',
    route: 'oral',
    frequency: 'twice-daily',
    scheduleTimes: ['09:00', '21:00'],
    prescribedBy: 'Dr. Lucio Ferreyra',
    startDate: toIsoDateString('2026-03-01T00:00:00.000Z'),
    status: 'active',
    audit: { ...baseAudit },
    ...overrides,
  };

  const orderId =
    overrides.id ??
    createEntityId(
      'medication',
      `${orderBase.medicationName} ${orderBase.residentId} ${orderBase.scheduleTimes.join('-')}`,
    );

  return {
    ...orderBase,
    id: orderId,
    audit: { ...baseAudit, ...overrides.audit },
  };
}

export function isMedicationActive(
  order: MedicationOrder,
  referenceDate: IsoDateString = toIsoDateString(new Date()),
): boolean {
  if (order.status !== 'active') {
    return false;
  }

  const current = new Date(referenceDate).getTime();
  const start = new Date(order.startDate).getTime();
  const end = order.endDate ? new Date(order.endDate).getTime() : undefined;

  return current >= start && (end === undefined || current <= end);
}
