import { Injectable } from '@nestjs/common';

import type { Resident } from '@gentrix/domain-residents';
import type {
  ResidentEvent,
  ResidentObservation,
  ResidentObservationResolutionType,
} from '@gentrix/shared-types';
import { createEntityId, toIsoDateString } from '@gentrix/shared-utils';

import { seedResidents } from '../../../../../common/persistence/in-memory-seed';
import type {
  ResidentEventRecordInput,
  ResidentObservationEntryRecordInput,
  ResidentObservationRecordInput,
  ResidentObservationResolveRecordInput,
  ResidentRepository,
} from '../../../domain/repositories/resident.repository';

@Injectable()
export class InMemoryResidentRepository implements ResidentRepository {
  private readonly residents: Resident[] = seedResidents.map(cloneResident);
  private readonly residentEvents: ResidentEvent[] = createSeedResidentEvents(
    this.residents,
  );
  private readonly residentObservations: ResidentObservation[] = [];

  async list(organizationId?: string): Promise<Resident[]> {
    return this.residents
      .filter((resident) =>
        organizationId ? resident.organizationId === organizationId : true,
      )
      .map(cloneResident);
  }

  async findById(
    id: string,
    organizationId?: string,
  ): Promise<Resident | null> {
    const resident = this.residents.find(
      (candidate) =>
        candidate.id === id &&
        (organizationId ? candidate.organizationId === organizationId : true),
    );

    if (!resident) {
      return null;
    }

    return cloneResident(resident);
  }

  async create(resident: Resident): Promise<Resident> {
    const persistedResident = cloneResident(resident);

    this.residents.unshift(persistedResident);
    return cloneResident(persistedResident);
  }

  async update(resident: Resident): Promise<Resident> {
    const residentIndex = this.residents.findIndex(
      (candidate) => candidate.id === resident.id,
    );

    if (residentIndex === -1) {
      throw new Error(`Resident ${resident.id} not found.`);
    }

    const persistedResident = cloneResident(resident);
    this.residents.splice(residentIndex, 1, persistedResident);
    return cloneResident(persistedResident);
  }

  async touchAudit(
    residentId: Resident['id'],
    actor: string,
    organizationId?: Resident['organizationId'],
  ): Promise<void> {
    const residentIndex = this.residents.findIndex(
      (candidate) =>
        candidate.id === residentId &&
        (organizationId ? candidate.organizationId === organizationId : true),
    );

    if (residentIndex === -1) {
      return;
    }

    this.residents[residentIndex] = {
      ...this.residents[residentIndex],
      audit: {
        ...this.residents[residentIndex].audit,
        updatedAt: toIsoDateString(new Date()),
        updatedBy: actor,
      },
    };
  }

  async listEvents(
    organizationId?: Resident['organizationId'],
  ): Promise<ResidentEvent[]> {
    return this.residentEvents
      .filter((event) => {
        if (!organizationId) {
          return true;
        }

        return this.residents.some(
          (resident) =>
            resident.id === event.residentId &&
            resident.organizationId === organizationId,
        );
      })
      .sort(
        (left, right) =>
          new Date(right.occurredAt).getTime() -
          new Date(left.occurredAt).getTime(),
      )
      .map(cloneResidentEvent);
  }

  async listEventsByResidentId(
    residentId: Resident['id'],
    organizationId?: Resident['organizationId'],
  ): Promise<ResidentEvent[]> {
    return this.residentEvents
      .filter(
        (event) =>
          event.residentId === residentId &&
          (!organizationId ||
            this.residents.some(
              (resident) =>
                resident.id === residentId &&
                resident.organizationId === organizationId,
            )),
      )
      .sort(
        (left, right) =>
          new Date(right.occurredAt).getTime() -
          new Date(left.occurredAt).getTime(),
      )
      .map(cloneResidentEvent);
  }

  async createEvent(event: ResidentEventRecordInput): Promise<ResidentEvent> {
    const createdEvent: ResidentEvent = {
      id: createEntityId(
        'resident-event',
        `${event.residentId}-${event.eventType}-${event.createdAt}`,
      ),
      residentId: event.residentId,
      eventType: event.eventType,
      title: event.title,
      description: event.description,
      occurredAt: event.occurredAt,
      actor: event.actor,
      audit: {
        createdAt: event.createdAt,
        updatedAt: event.createdAt,
        createdBy: event.actor,
        updatedBy: event.actor,
      },
    };

    this.residentEvents.unshift(createdEvent);
    return cloneResidentEvent(createdEvent);
  }

  async listObservations(
    organizationId?: Resident['organizationId'],
  ): Promise<ResidentObservation[]> {
    return this.residentObservations
      .filter((observation) => {
        if (!organizationId) {
          return true;
        }

        return this.residents.some(
          (resident) =>
            resident.id === observation.residentId &&
            resident.organizationId === organizationId,
        );
      })
      .map(cloneResidentObservation);
  }

  async listObservationsByResidentId(
    residentId: Resident['id'],
    organizationId?: Resident['organizationId'],
  ): Promise<ResidentObservation[]> {
    return this.residentObservations
      .filter(
        (observation) =>
          observation.residentId === residentId &&
          (!organizationId ||
            this.residents.some(
              (resident) =>
                resident.id === residentId &&
                resident.organizationId === organizationId,
            )),
      )
      .map(cloneResidentObservation);
  }

  async findObservationById(
    observationId: ResidentObservation['id'],
    residentId: Resident['id'],
    organizationId?: Resident['organizationId'],
  ): Promise<ResidentObservation | null> {
    const observation = this.residentObservations.find(
      (candidate) =>
        candidate.id === observationId &&
        candidate.residentId === residentId &&
        (!organizationId ||
          this.residents.some(
            (resident) =>
              resident.id === residentId &&
              resident.organizationId === organizationId,
          )),
    );

    return observation ? cloneResidentObservation(observation) : null;
  }

  async createObservation(
    observation: ResidentObservationRecordInput,
  ): Promise<ResidentObservation> {
    const createdObservation: ResidentObservation = {
      id: createEntityId(
        'resident-observation',
        `${observation.residentId}-${observation.title}-${observation.openedAt}`,
      ),
      residentId: observation.residentId,
      status: 'active',
      severity: observation.severity,
      title: observation.title,
      description: observation.description,
      openedAt: observation.openedAt,
      openedBy: observation.actor,
      entries: [],
      audit: {
        createdAt: observation.openedAt,
        updatedAt: observation.openedAt,
        createdBy: observation.actor,
        updatedBy: observation.actor,
      },
    };

    this.residentObservations.unshift(createdObservation);
    return cloneResidentObservation(createdObservation);
  }

  async createObservationEntry(
    entry: ResidentObservationEntryRecordInput,
  ): Promise<ResidentObservation> {
    const observationIndex = this.residentObservations.findIndex(
      (candidate) => candidate.id === entry.observationId,
    );

    if (observationIndex === -1) {
      throw new Error(`Observation ${entry.observationId} not found.`);
    }

    const currentObservation = this.residentObservations[observationIndex];
    const createdEntry = {
      id: createEntityId(
        'resident-observation-entry',
        `${entry.observationId}-${entry.entryType}-${entry.occurredAt}`,
      ),
      observationId: entry.observationId,
      residentId: entry.residentId,
      entryType: entry.entryType,
      title: entry.title,
      description: entry.description,
      occurredAt: entry.occurredAt,
      actor: entry.actor,
      audit: {
        createdAt: entry.occurredAt,
        updatedAt: entry.occurredAt,
        createdBy: entry.actor,
        updatedBy: entry.actor,
      },
    } satisfies ResidentObservation['entries'][number];

    const updatedObservation: ResidentObservation = {
      ...currentObservation,
      entries: [createdEntry, ...currentObservation.entries].map((candidate) => ({
        ...candidate,
        audit: { ...candidate.audit },
      })),
      audit: {
        ...currentObservation.audit,
        updatedAt: entry.occurredAt,
        updatedBy: entry.actor,
      },
    };

    this.residentObservations.splice(observationIndex, 1, updatedObservation);
    return cloneResidentObservation(updatedObservation);
  }

  async resolveObservation(
    resolution: ResidentObservationResolveRecordInput,
  ): Promise<ResidentObservation> {
    const observationIndex = this.residentObservations.findIndex(
      (candidate) => candidate.id === resolution.observationId,
    );

    if (observationIndex === -1) {
      throw new Error(`Observation ${resolution.observationId} not found.`);
    }

    const currentObservation = this.residentObservations[observationIndex];
    const resolutionEntry = {
      id: createEntityId(
        'resident-observation-entry',
        `${resolution.observationId}-resolution-${resolution.resolvedAt}`,
      ),
      observationId: resolution.observationId,
      residentId: resolution.residentId,
      entryType: 'resolution',
      title: buildResolutionTitle(resolution.resolutionType),
      description: resolution.summary,
      occurredAt: resolution.resolvedAt,
      actor: resolution.actor,
      audit: {
        createdAt: resolution.resolvedAt,
        updatedAt: resolution.resolvedAt,
        createdBy: resolution.actor,
        updatedBy: resolution.actor,
      },
    } satisfies ResidentObservation['entries'][number];

    const updatedObservation: ResidentObservation = {
      ...currentObservation,
      status: 'resolved',
      resolvedAt: resolution.resolvedAt,
      resolvedBy: resolution.actor,
      resolutionType: resolution.resolutionType,
      resolutionSummary: resolution.summary,
      entries: [resolutionEntry, ...currentObservation.entries].map(
        (candidate) => ({
          ...candidate,
          audit: { ...candidate.audit },
        }),
      ),
      audit: {
        ...currentObservation.audit,
        updatedAt: resolution.resolvedAt,
        updatedBy: resolution.actor,
      },
    };

    this.residentObservations.splice(observationIndex, 1, updatedObservation);
    return cloneResidentObservation(updatedObservation);
  }
}

function cloneResident(resident: Resident): Resident {
  return {
    ...resident,
    medicalHistory: resident.medicalHistory.map((entry) => ({ ...entry })),
    attachments: resident.attachments.map((attachment) => ({ ...attachment })),
    insurance: { ...resident.insurance },
    transfer: { ...resident.transfer },
    psychiatry: { ...resident.psychiatry },
    clinicalProfile: { ...resident.clinicalProfile },
    belongings: { ...resident.belongings },
    familyContacts: resident.familyContacts.map((contact) => ({ ...contact })),
    discharge: { ...resident.discharge },
    address: { ...resident.address },
    emergencyContact: { ...resident.emergencyContact },
    audit: { ...resident.audit },
  };
}

function cloneResidentEvent(event: ResidentEvent): ResidentEvent {
  return {
    ...event,
    audit: { ...event.audit },
  };
}

function cloneResidentObservation(
  observation: ResidentObservation,
): ResidentObservation {
  return {
    ...observation,
    entries: observation.entries.map((entry) => ({
      ...entry,
      audit: { ...entry.audit },
    })),
    audit: { ...observation.audit },
  };
}

function createSeedResidentEvents(residents: Resident[]): ResidentEvent[] {
  const [martaDiaz, elenaSuarez] = residents;
  const timelineEvents: ResidentEvent[] = residents.flatMap((resident) =>
    resident.medicalHistory.map(
      (entry) =>
        ({
          id: entry.id,
          residentId: resident.id,
          eventType: 'medical-history',
          title: entry.title,
          description: entry.notes,
          occurredAt: entry.recordedAt,
          actor: resident.audit.createdBy,
          audit: {
            createdAt: entry.createdAt,
            updatedAt: resident.audit.updatedAt,
            createdBy: resident.audit.createdBy,
            updatedBy: resident.audit.updatedBy,
          },
        }) satisfies ResidentEvent,
    ),
  );

  if (martaDiaz) {
    timelineEvents.push({
      id: createEntityId('resident-event', 'marta-admission-note'),
      residentId: martaDiaz.id,
      eventType: 'admission-note',
      title: 'Ingreso y evaluacion inicial',
      description:
        'Se registra ingreso con movilidad asistida y plan base de observacion diaria.',
      occurredAt: toIsoDateString('2024-11-03T12:30:00.000Z'),
      actor: 'seed-script',
      audit: {
        createdAt: toIsoDateString('2024-11-03T12:30:00.000Z'),
        updatedAt: toIsoDateString('2024-11-03T12:30:00.000Z'),
        createdBy: 'seed-script',
        updatedBy: 'seed-script',
      },
    });
  }

  if (elenaSuarez) {
    timelineEvents.push({
      id: createEntityId('resident-event', 'elena-follow-up'),
      residentId: elenaSuarez.id,
      eventType: 'follow-up',
      title: 'Seguimiento cognitivo',
      description:
        'Se registra seguimiento neurologico con refuerzo de rutina nocturna y acompanamiento.',
      occurredAt: toIsoDateString('2026-03-12T18:00:00.000Z'),
      actor: 'seed-script',
      audit: {
        createdAt: toIsoDateString('2026-03-12T18:00:00.000Z'),
        updatedAt: toIsoDateString('2026-03-12T18:00:00.000Z'),
        createdBy: 'seed-script',
        updatedBy: 'seed-script',
      },
    });
  }

  return timelineEvents.map(cloneResidentEvent);
}

function buildResolutionTitle(
  resolutionType: ResidentObservationResolutionType,
): string {
  switch (resolutionType) {
    case 'medical-visit':
      return 'Derivacion medica';
    case 'phone-call':
      return 'Llamado realizado';
    default:
      return 'Observacion cerrada';
  }
}
