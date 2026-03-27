import { describe, expect, it } from 'vitest';

import {
  createMedicationSeed,
  toMedicationOverview,
  type MedicationExecution,
} from '@gentrix/domain-medication';
import { createResidentSeed, toResidentCard } from '@gentrix/domain-residents';
import type { ResidentEvent } from '@gentrix/shared-types';
import { createEntityId } from '@gentrix/shared-utils';

import { deriveDashboardAlerts } from './dashboard-alerts';

describe('deriveDashboardAlerts', () => {
  it('mixes early derived alerts with real medication execution signals', () => {
    const referenceDate = new Date('2026-03-27T10:00:00.000Z');
    const marta = createResidentSeed({
      id: 'resident-marta',
      firstName: 'Marta',
      lastName: 'Diaz',
      room: 'A-101',
      careLevel: 'assisted',
    });
    const elena = createResidentSeed({
      id: 'resident-elena',
      firstName: 'Elena',
      lastName: 'Suarez',
      room: 'B-204',
      careLevel: 'memory-care',
    });
    const raul = createResidentSeed({
      id: 'resident-raul',
      firstName: 'Raul',
      lastName: 'Benitez',
      room: 'C-301',
      careLevel: 'high-dependency',
    });
    const residents = [marta, elena, raul].map(toResidentCard);
    const medications = [
      toMedicationOverview(
        createMedicationSeed(marta.id, {
          id: 'medication-marta',
          medicationName: 'Paracetamol',
          route: 'oral',
          scheduleTimes: ['09:00'],
        }),
        marta.firstName + ' ' + marta.lastName,
      ),
      toMedicationOverview(
        createMedicationSeed(elena.id, {
          id: 'medication-elena',
          medicationName: 'Donepezil',
          route: 'oral',
          frequency: 'nightly',
          scheduleTimes: ['21:00'],
        }),
        elena.firstName + ' ' + elena.lastName,
      ),
      toMedicationOverview(
        createMedicationSeed(raul.id, {
          id: 'medication-raul',
          medicationName: 'Enoxaparina',
          route: 'subcutaneous',
          scheduleTimes: ['08:00'],
        }),
        raul.firstName + ' ' + raul.lastName,
      ),
    ];
    const residentEvents: ResidentEvent[] = [
      {
        id: 'resident-event-elena-follow-up',
        residentId: elena.id,
        eventType: 'follow-up',
        title: 'Seguimiento cognitivo',
        description: 'Se ajusta la rutina nocturna con acompanamiento cercano.',
        occurredAt: '2026-03-12T18:00:00.000Z',
        actor: 'seed-script',
        audit: {
          createdAt: '2026-03-12T18:00:00.000Z',
          updatedAt: '2026-03-12T18:00:00.000Z',
          createdBy: 'seed-script',
          updatedBy: 'seed-script',
        },
      },
    ];
    const medicationExecutions: MedicationExecution[] = [
      createMedicationExecutionSeed({
        id: 'execution-elena-rejected',
        medicationOrderId: 'medication-elena',
        residentId: elena.id,
        medicationName: 'Donepezil',
        result: 'rejected',
        occurredAt: '2026-03-26T21:10:00.000Z',
      }),
      createMedicationExecutionSeed({
        id: 'execution-raul-omitted',
        medicationOrderId: 'medication-raul',
        residentId: raul.id,
        medicationName: 'Enoxaparina',
        result: 'omitted',
        occurredAt: '2026-03-26T08:15:00.000Z',
      }),
    ];

    const alerts = deriveDashboardAlerts({
      residents,
      medications,
      residentEvents,
      medicationExecutions,
      referenceDate,
    });

    expect(alerts).toHaveLength(6);
    expect(alerts.map((alert) => alert.source)).toEqual(
      expect.arrayContaining([
        'medication-execution',
        'resident-care-level',
        'medication-order',
        'resident-event',
      ]),
    );
    expect(alerts[0]).toMatchObject({
      source: 'medication-execution',
      severity: 'critical',
      title: 'Toma rechazada',
      residentName: 'Elena Suarez',
    });
    expect(
      alerts.some(
        (alert) =>
          alert.source === 'medication-order' &&
          alert.message.includes('Enoxaparina'),
      ),
    ).toBe(true);
    expect(
      alerts.some(
        (alert) =>
          alert.source === 'resident-event' &&
          alert.message.includes('Seguimiento cognitivo'),
      ),
    ).toBe(true);
  });

  it('ignores stale events and administered executions without operational risk', () => {
    const referenceDate = new Date('2026-03-27T10:00:00.000Z');
    const resident = createResidentSeed({
      id: 'resident-marta',
      firstName: 'Marta',
      lastName: 'Diaz',
      room: 'A-101',
      careLevel: 'assisted',
    });
    const medications = [
      toMedicationOverview(
        createMedicationSeed(resident.id, {
          id: 'medication-marta',
          medicationName: 'Paracetamol',
          route: 'oral',
          scheduleTimes: ['09:00'],
        }),
        'Marta Diaz',
      ),
    ];
    const residentEvents: ResidentEvent[] = [
      {
        id: 'resident-event-old',
        residentId: resident.id,
        eventType: 'follow-up',
        title: 'Seguimiento antiguo',
        description: 'Evento fuera de la ventana operativa.',
        occurredAt: '2026-01-15T08:00:00.000Z',
        actor: 'seed-script',
        audit: {
          createdAt: '2026-01-15T08:00:00.000Z',
          updatedAt: '2026-01-15T08:00:00.000Z',
          createdBy: 'seed-script',
          updatedBy: 'seed-script',
        },
      },
    ];
    const medicationExecutions: MedicationExecution[] = [
      createMedicationExecutionSeed({
        id: 'execution-administered',
        medicationOrderId: 'medication-marta',
        residentId: resident.id,
        medicationName: 'Paracetamol',
        result: 'administered',
        occurredAt: '2026-03-26T09:05:00.000Z',
      }),
    ];

    const alerts = deriveDashboardAlerts({
      residents: [toResidentCard(resident)],
      medications,
      residentEvents,
      medicationExecutions,
      referenceDate,
    });

    expect(alerts).toEqual([]);
  });
});

function createMedicationExecutionSeed(
  overrides: Partial<MedicationExecution> = {},
): MedicationExecution {
  return {
    id: createEntityId('medication-execution', 'seed'),
    organizationId: createEntityId('organization', 'gentrix demo'),
    facilityId: createEntityId('facility', 'residencia central'),
    medicationOrderId: 'medication-seed',
    residentId: 'resident-seed',
    medicationName: 'Paracetamol',
    result: 'administered',
    occurredAt: '2026-03-26T09:05:00.000Z',
    audit: {
      createdAt: '2026-03-26T09:05:00.000Z',
      updatedAt: '2026-03-26T09:05:00.000Z',
      createdBy: 'seed-script',
      updatedBy: 'seed-script',
    },
    ...overrides,
  };
}
