import { describe, expect, it } from 'vitest';

import {
  createMedicationSeed,
  toMedicationOverview,
  type MedicationExecution,
} from '@gentrix/domain-medication';
import { createResidentSeed, toResidentCard } from '@gentrix/domain-residents';
import type { ResidentEvent, ResidentObservation } from '@gentrix/shared-types';
import { createEntityId } from '@gentrix/shared-utils';

import { deriveHandoffSnapshot } from './handoff-snapshot';

describe('deriveHandoffSnapshot', () => {
  it('builds a morning handoff with pending medication, omitted execution and recent events', () => {
    const referenceDate = new Date('2026-03-27T10:30:00.000-03:00');
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

    const snapshot = deriveHandoffSnapshot({
      residents: [marta, elena, raul].map(toResidentCard),
      medications: [
        toMedicationOverview(
          createMedicationSeed(marta.id, {
            id: 'medication-marta',
            medicationName: 'Paracetamol',
            scheduleTimes: ['09:00'],
          }),
          'Marta Diaz',
        ),
        toMedicationOverview(
          createMedicationSeed(elena.id, {
            id: 'medication-elena',
            medicationName: 'Quetiapina',
            scheduleTimes: ['10:00'],
          }),
          'Elena Suarez',
        ),
        toMedicationOverview(
          createMedicationSeed(raul.id, {
            id: 'medication-raul',
            medicationName: 'Enoxaparina',
            route: 'subcutaneous',
            scheduleTimes: ['08:00'],
          }),
          'Raul Benitez',
        ),
      ],
      residentEvents: [
        createResidentEventSeed({
          id: 'resident-event-elena-follow-up',
          residentId: elena.id,
          title: 'Seguimiento cognitivo',
          occurredAt: '2026-03-26T18:00:00.000-03:00',
        }),
      ],
      residentObservations: [
        createResidentObservationSeed({
          id: 'resident-observation-elena',
          residentId: elena.id,
          severity: 'warning',
          title: 'Menor ingesta en la tarde',
          description: 'Queda en observacion por menor ingesta.',
          openedAt: '2026-03-26T17:30:00.000-03:00',
          entries: [
            createResidentObservationEntrySeed({
              id: 'resident-observation-entry-elena-action',
              observationId: 'resident-observation-elena',
              residentId: elena.id,
              entryType: 'action',
              title: 'Aviso a familia',
              description: 'Se avisa a la hija para seguimiento.',
              occurredAt: '2026-03-26T20:10:00.000-03:00',
            }),
          ],
        }),
      ],
      medicationExecutions: [
        createMedicationExecutionSeed({
          id: 'execution-marta-administered',
          medicationOrderId: 'medication-marta',
          residentId: marta.id,
          medicationName: 'Paracetamol',
          result: 'administered',
          occurredAt: '2026-03-27T09:05:00.000-03:00',
        }),
        createMedicationExecutionSeed({
          id: 'execution-raul-omitted',
          medicationOrderId: 'medication-raul',
          residentId: raul.id,
          medicationName: 'Enoxaparina',
          result: 'omitted',
          occurredAt: '2026-03-27T08:12:00.000-03:00',
        }),
      ],
      referenceDate,
    });

    expect(snapshot.shift).toBe('morning');
    expect(snapshot.nextShift).toBe('afternoon');
    expect(snapshot.summary).toMatchObject({
      residentCount: 3,
      relevantResidentCount: 2,
      activeObservationCount: 1,
      recentEventCount: 1,
      pendingMedicationCount: 1,
      omittedMedicationCount: 1,
      rejectedMedicationCount: 0,
    });
    expect(snapshot.residents.map((resident) => resident.fullName)).toEqual([
      'Raul Benitez',
      'Elena Suarez',
    ]);
    expect(snapshot.residents[0]).toMatchObject({
      residentId: raul.id,
      priority: 'critical',
    });
    expect(snapshot.residents[0].medicationIssues[0]).toMatchObject({
      medicationName: 'Enoxaparina',
      status: 'omitted',
    });
    expect(snapshot.residents[1]).toMatchObject({
      residentId: elena.id,
      priority: 'warning',
    });
    expect(snapshot.residents[1].observations[0]).toMatchObject({
      title: 'Menor ingesta en la tarde',
      latestEntrySummary: 'Aviso a familia: Se avisa a la hija para seguimiento.',
    });
    expect(snapshot.residents[1].medicationIssues[0]).toMatchObject({
      medicationName: 'Quetiapina',
      status: 'pending',
      scheduledFor: '2026-03-27T13:00:00.000Z',
    });
    expect(snapshot.residents[1].recentEvents[0]).toMatchObject({
      title: 'Seguimiento cognitivo',
    });
  });

  it('handles night shift windows across midnight and ignores future doses', () => {
    const referenceDate = new Date('2026-03-27T02:30:00.000-03:00');
    const resident = createResidentSeed({
      id: 'resident-nocturno',
      firstName: 'Lucia',
      lastName: 'Romero',
      room: 'N-12',
      careLevel: 'assisted',
    });

    const snapshot = deriveHandoffSnapshot({
      residents: [toResidentCard(resident)],
      medications: [
        toMedicationOverview(
          createMedicationSeed(resident.id, {
            id: 'medication-night-rejected',
            medicationName: 'Clonazepam',
            frequency: 'nightly',
            scheduleTimes: ['23:00', '03:00'],
          }),
          'Lucia Romero',
        ),
        toMedicationOverview(
          createMedicationSeed(resident.id, {
            id: 'medication-night-pending',
            medicationName: 'Melatonina',
            frequency: 'nightly',
            scheduleTimes: ['01:00'],
          }),
          'Lucia Romero',
        ),
      ],
      residentEvents: [],
      residentObservations: [
        createResidentObservationSeed({
          id: 'resident-observation-critical',
          residentId: resident.id,
          severity: 'critical',
          title: 'Saturacion inestable',
          description: 'Queda en observacion respiratoria.',
          openedAt: '2026-03-26T23:20:00.000-03:00',
        }),
      ],
      medicationExecutions: [
        createMedicationExecutionSeed({
          id: 'execution-night-rejected',
          medicationOrderId: 'medication-night-rejected',
          residentId: resident.id,
          medicationName: 'Clonazepam',
          result: 'rejected',
          occurredAt: '2026-03-26T23:08:00.000-03:00',
        }),
      ],
      referenceDate,
    });

    expect(snapshot.shift).toBe('night');
    expect(snapshot.nextShift).toBe('morning');
    expect(snapshot.summary).toMatchObject({
      residentCount: 1,
      relevantResidentCount: 1,
      activeObservationCount: 1,
      pendingMedicationCount: 1,
      omittedMedicationCount: 0,
      rejectedMedicationCount: 1,
    });
    expect(snapshot.residents[0].priority).toBe('critical');
    expect(snapshot.residents[0].medicationIssues).toHaveLength(2);
    expect(snapshot.residents[0].medicationIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          medicationName: 'Clonazepam',
          status: 'rejected',
          scheduledFor: '2026-03-27T02:00:00.000Z',
        }),
        expect.objectContaining({
          medicationName: 'Melatonina',
          status: 'pending',
          scheduledFor: '2026-03-27T04:00:00.000Z',
        }),
      ]),
    );
    expect(
      snapshot.residents[0].medicationIssues.some(
        (issue) => issue.scheduledFor === '2026-03-27T06:00:00.000Z',
      ),
    ).toBe(false);
  });
});

function createResidentEventSeed(
  overrides: Partial<ResidentEvent> = {},
): ResidentEvent {
  return {
    id: 'resident-event-seed',
    residentId: 'resident-seed',
    eventType: 'follow-up',
    title: 'Seguimiento simple',
    description: 'Se observa evolucion estable.',
    occurredAt: '2026-03-26T18:00:00.000-03:00',
    actor: 'seed-script',
    audit: {
      createdAt: '2026-03-26T18:00:00.000-03:00',
      updatedAt: '2026-03-26T18:00:00.000-03:00',
      createdBy: 'seed-script',
      updatedBy: 'seed-script',
    },
    ...overrides,
  };
}

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
    occurredAt: '2026-03-27T09:05:00.000-03:00',
    audit: {
      createdAt: '2026-03-27T09:05:00.000-03:00',
      updatedAt: '2026-03-27T09:05:00.000-03:00',
      createdBy: 'seed-script',
      updatedBy: 'seed-script',
    },
    ...overrides,
  };
}

function createResidentObservationSeed(
  overrides: Partial<ResidentObservation> = {},
): ResidentObservation {
  return {
    id: 'resident-observation-seed',
    residentId: 'resident-seed',
    status: 'active',
    severity: 'warning',
    title: 'Observacion simple',
    description: 'Se deja seguimiento operativo.',
    openedAt: '2026-03-26T17:30:00.000-03:00',
    openedBy: 'seed-script',
    entries: [],
    audit: {
      createdAt: '2026-03-26T17:30:00.000-03:00',
      updatedAt: '2026-03-26T17:30:00.000-03:00',
      createdBy: 'seed-script',
      updatedBy: 'seed-script',
    },
    ...overrides,
  };
}

function createResidentObservationEntrySeed(
  overrides: Partial<ResidentObservation['entries'][number]> = {},
): ResidentObservation['entries'][number] {
  return {
    id: 'resident-observation-entry-seed',
    observationId: 'resident-observation-seed',
    residentId: 'resident-seed',
    entryType: 'follow-up',
    title: 'Seguimiento simple',
    description: 'Se observa evolucion estable.',
    occurredAt: '2026-03-26T18:00:00.000-03:00',
    actor: 'seed-script',
    audit: {
      createdAt: '2026-03-26T18:00:00.000-03:00',
      updatedAt: '2026-03-26T18:00:00.000-03:00',
      createdBy: 'seed-script',
      updatedBy: 'seed-script',
    },
    ...overrides,
  };
}
