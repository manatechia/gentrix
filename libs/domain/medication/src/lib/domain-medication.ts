import type {
  AuditTrail,
  EntityId,
  EntityStatus,
  IsoDateString,
  MedicationCatalogItem,
  MedicationCreateInput,
  MedicationDetail,
  MedicationFrequency,
  MedicationOverview,
  MedicationRoute,
  MedicationUpdateInput,
} from '@gentrix/shared-types';
import {
  createEntityId,
  createRandomEntityId,
  toIsoDateString,
} from '@gentrix/shared-utils';

export interface MedicationOrder {
  id: EntityId;
  medicationCatalogId: EntityId;
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

const medicationFrequencyLabels: Record<MedicationFrequency, string> = {
  daily: 'A diario',
  'twice-daily': 'Dos veces al dia',
  nightly: 'Por la noche',
  'as-needed': 'Segun necesidad',
};

const baseAudit: AuditTrail = {
  createdAt: toIsoDateString('2026-01-10T09:00:00.000Z'),
  updatedAt: toIsoDateString('2026-03-15T09:00:00.000Z'),
  createdBy: 'setup-script',
  updatedBy: 'setup-script',
};

export const medicationRoutes: MedicationRoute[] = [
  'oral',
  'intravenous',
  'subcutaneous',
  'topical',
];

export const medicationFrequencies: MedicationFrequency[] = [
  'daily',
  'twice-daily',
  'nightly',
  'as-needed',
];

export function isMedicationRoute(value: unknown): value is MedicationRoute {
  return (
    typeof value === 'string' &&
    medicationRoutes.includes(value as MedicationRoute)
  );
}

export function isMedicationFrequency(
  value: unknown,
): value is MedicationFrequency {
  return (
    typeof value === 'string' &&
    medicationFrequencies.includes(value as MedicationFrequency)
  );
}

export function createMedicationCatalogSeed(
  overrides: Partial<MedicationCatalogItem> & Pick<MedicationCatalogItem, 'medicationName'>,
): MedicationCatalogItem {
  const medicationName = overrides.medicationName.trim();

  return {
    id:
      overrides.id ??
      createEntityId('medication-catalog', medicationName),
    medicationName,
    activeIngredient: overrides.activeIngredient?.trim() || medicationName,
    status: overrides.status ?? 'active',
  };
}

export function createMedicationSeed(
  residentId: EntityId,
  overrides: Partial<MedicationOrder> = {},
): MedicationOrder {
  const catalogItem =
    overrides.medicationName
      ? createMedicationCatalogSeed({
          id: overrides.medicationCatalogId,
          medicationName: overrides.medicationName,
        })
      : createMedicationCatalogSeed({
          id: overrides.medicationCatalogId,
          medicationName: 'Paracetamol',
        });
  const orderBase: MedicationOrder = {
    id: createEntityId(
      'medication',
      `${catalogItem.medicationName} ${residentId} 09:00-21:00`,
    ),
    medicationCatalogId: catalogItem.id,
    residentId,
    medicationName: catalogItem.medicationName,
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
    medicationCatalogId: orderBase.medicationCatalogId,
    medicationName: orderBase.medicationName,
    scheduleTimes: [...orderBase.scheduleTimes],
    audit: { ...baseAudit, ...overrides.audit },
  };
}

export function createMedicationFromInput(
  input: MedicationCreateInput,
  medicationName: string,
  actor: string,
  referenceDate: Date = new Date(),
): MedicationOrder {
  const now = toIsoDateString(referenceDate);

  return {
    id: createRandomEntityId(),
    ...mapMedicationInput(input, medicationName),
    audit: {
      createdAt: now,
      updatedAt: now,
      createdBy: actor,
      updatedBy: actor,
    },
  };
}

export function updateMedicationFromInput(
  currentOrder: MedicationOrder,
  input: MedicationUpdateInput,
  medicationName: string,
  actor: string,
  referenceDate: Date = new Date(),
): MedicationOrder {
  return {
    ...currentOrder,
    ...mapMedicationInput(input, medicationName),
    audit: {
      ...currentOrder.audit,
      updatedAt: toIsoDateString(referenceDate),
      updatedBy: actor,
    },
  };
}

export function buildMedicationSchedule(
  order: Pick<MedicationOrder, 'frequency' | 'scheduleTimes'>,
): string {
  const frequencyLabel =
    medicationFrequencyLabels[order.frequency] ?? order.frequency;

  if (!order.scheduleTimes.length) {
    return frequencyLabel;
  }

  return `${frequencyLabel} a las ${order.scheduleTimes.join(', ')}`;
}

export function toMedicationOverview(
  order: MedicationOrder,
  residentName: string,
): MedicationOverview {
  return {
    id: order.id,
    medicationCatalogId: order.medicationCatalogId,
    residentId: order.residentId,
    residentName,
    medicationName: order.medicationName,
    dose: order.dose,
    route: order.route,
    frequency: order.frequency,
    scheduleTimes: [...order.scheduleTimes],
    prescribedBy: order.prescribedBy,
    startDate: order.startDate,
    endDate: order.endDate,
    status: order.status,
    active: isMedicationActive(order),
    schedule: buildMedicationSchedule(order),
  };
}

export function toMedicationDetail(
  order: MedicationOrder,
  residentName: string,
): MedicationDetail {
  return {
    ...toMedicationOverview(order, residentName),
    audit: { ...order.audit },
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

function mapMedicationInput(
  input: MedicationCreateInput | MedicationUpdateInput,
  medicationName: string,
): Omit<MedicationOrder, 'id' | 'audit'> {
  return {
    medicationCatalogId: input.medicationCatalogId,
    residentId: input.residentId,
    medicationName: medicationName.trim(),
    dose: input.dose.trim(),
    route: input.route,
    frequency: input.frequency,
    scheduleTimes: input.scheduleTimes
      .map((value) => value.trim())
      .filter(
        (value, index, values) =>
          value.length > 0 && values.indexOf(value) === index,
      ),
    prescribedBy: input.prescribedBy.trim(),
    startDate: toIsoDateString(input.startDate),
    endDate: input.endDate ? toIsoDateString(input.endDate) : undefined,
    status: input.status,
  };
}
