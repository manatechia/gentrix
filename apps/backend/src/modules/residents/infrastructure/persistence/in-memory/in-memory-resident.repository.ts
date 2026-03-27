import { Injectable } from '@nestjs/common';

import type { Resident } from '@gentrix/domain-residents';
import type { ResidentEvent } from '@gentrix/shared-types';
import { createEntityId, toIsoDateString } from '@gentrix/shared-utils';

import { seedResidents } from '../../../../../common/persistence/in-memory-seed';
import type {
  ResidentEventRecordInput,
  ResidentRepository,
} from '../../../domain/repositories/resident.repository';

@Injectable()
export class InMemoryResidentRepository implements ResidentRepository {
  private readonly residents: Resident[] = seedResidents.map(cloneResident);
  private readonly residentEvents: ResidentEvent[] = createSeedResidentEvents(
    this.residents,
  );

  async list(organizationId?: string): Promise<Resident[]> {
    return this.residents
      .filter((resident) =>
        organizationId ? resident.organizationId === organizationId : true,
      )
      .map(cloneResident);
  }

  async findById(id: string, organizationId?: string): Promise<Resident | null> {
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
          new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
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
