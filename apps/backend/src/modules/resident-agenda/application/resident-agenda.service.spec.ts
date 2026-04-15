import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createResidentSeed, type Resident } from '@gentrix/domain-residents';
import type {
  EntityId,
  ResidentAgendaEvent,
  ResidentAgendaEventCreateInput,
  ResidentAgendaEventUpdateInput,
  ResidentAgendaEventWithResident,
} from '@gentrix/shared-types';

import type { ResidentsService } from '../../residents/application/residents.service';
import type { ResidentAgendaRepository } from '../domain/repositories/resident-agenda.repository';
import { ResidentAgendaService } from './resident-agenda.service';

const FIXED_NOW = new Date('2026-04-15T10:00:00.000Z');
const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

class ResidentAgendaRepositoryStub implements ResidentAgendaRepository {
  public stored: ResidentAgendaEvent[] = [];
  public lastCreate: {
    residentId: string;
    input: ResidentAgendaEventCreateInput;
    actor: string;
  } | null = null;
  public lastUpdate: {
    eventId: string;
    input: ResidentAgendaEventUpdateInput;
    actor: string;
    organizationId?: string;
  } | null = null;
  public lastDelete: {
    eventId: string;
    actor: string;
    organizationId?: string;
  } | null = null;

  async listUpcomingByResidentId(
    residentId: EntityId,
    now: Date,
  ): Promise<ResidentAgendaEvent[]> {
    return this.stored
      .filter(
        (event) =>
          event.residentId === residentId &&
          new Date(event.scheduledAt).getTime() >= now.getTime(),
      )
      .sort(
        (left, right) =>
          new Date(left.scheduledAt).getTime() -
          new Date(right.scheduledAt).getTime(),
      );
  }

  async listUpcomingByOrganization(): Promise<ResidentAgendaEventWithResident[]> {
    return [];
  }

  async findById(eventId: EntityId): Promise<ResidentAgendaEvent | null> {
    return this.stored.find((event) => event.id === eventId) ?? null;
  }

  async create(
    residentId: EntityId,
    input: ResidentAgendaEventCreateInput,
    actor: string,
  ): Promise<ResidentAgendaEvent> {
    this.lastCreate = { residentId, input: { ...input }, actor };
    const now = FIXED_NOW.toISOString();
    const created: ResidentAgendaEvent = {
      id: 'agenda-event-001' as ResidentAgendaEvent['id'],
      residentId,
      title: input.title,
      description: input.description,
      scheduledAt: input.scheduledAt,
      audit: {
        createdAt: now,
        updatedAt: now,
        createdBy: actor,
        updatedBy: actor,
      },
    };
    this.stored.push(created);
    return created;
  }

  async update(
    eventId: EntityId,
    input: ResidentAgendaEventUpdateInput,
    actor: string,
    organizationId?: EntityId,
  ): Promise<ResidentAgendaEvent> {
    this.lastUpdate = { eventId, input: { ...input }, actor, organizationId };
    const index = this.stored.findIndex((event) => event.id === eventId);
    if (index === -1) {
      throw new Error('not found');
    }
    const current = this.stored[index];
    const updated: ResidentAgendaEvent = {
      ...current,
      title: input.title,
      description: input.description,
      scheduledAt: input.scheduledAt,
      audit: {
        ...current.audit,
        updatedAt: FIXED_NOW.toISOString(),
        updatedBy: actor,
      },
    };
    this.stored.splice(index, 1, updated);
    return updated;
  }

  async softDelete(
    eventId: EntityId,
    actor: string,
    organizationId?: EntityId,
  ): Promise<void> {
    this.lastDelete = { eventId, actor, organizationId };
    this.stored = this.stored.filter((event) => event.id !== eventId);
  }
}

class ResidentsServiceStub {
  public resident: Resident = createResidentSeed();
  public touchedAudit: { residentId: string; actor: string; organizationId?: string } | null =
    null;

  async getResidentEntityById(): Promise<Resident> {
    return this.resident;
  }

  async touchResidentAudit(
    residentId: string,
    actor: string,
    organizationId?: string,
  ): Promise<void> {
    this.touchedAudit = { residentId, actor, organizationId };
  }
}

function buildInput(
  overrides: Partial<ResidentAgendaEventCreateInput> = {},
): ResidentAgendaEventCreateInput {
  return {
    title: 'Dar medicacion',
    description: 'Tomar con comida',
    scheduledAt: new Date(FIXED_NOW.getTime() + ONE_DAY_MS).toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

describe('ResidentAgendaService.create', () => {
  it('crea un evento futuro y refresca la auditoria del residente', async () => {
    const repository = new ResidentAgendaRepositoryStub();
    const residentsService = new ResidentsServiceStub();
    const service = new ResidentAgendaService(
      repository,
      residentsService as unknown as ResidentsService,
    );

    const created = await service.create(
      residentsService.resident.id,
      buildInput(),
      'Sofia Quiroga',
    );

    expect(created.id).toBe('agenda-event-001');
    expect(created.audit.createdBy).toBe('Sofia Quiroga');
    expect(repository.lastCreate?.input.title).toBe('Dar medicacion');
    expect(residentsService.touchedAudit).toEqual({
      residentId: residentsService.resident.id,
      actor: 'Sofia Quiroga',
      organizationId: residentsService.resident.organizationId,
    });
  });

  it('rechaza eventos con fecha/hora en el pasado', async () => {
    const repository = new ResidentAgendaRepositoryStub();
    const residentsService = new ResidentsServiceStub();
    const service = new ResidentAgendaService(
      repository,
      residentsService as unknown as ResidentsService,
    );

    await expect(
      service.create(
        residentsService.resident.id,
        buildInput({
          scheduledAt: new Date(FIXED_NOW.getTime() - ONE_HOUR_MS).toISOString(),
        }),
        'Sofia Quiroga',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.lastCreate).toBeNull();
    expect(residentsService.touchedAudit).toBeNull();
  });

  it('rechaza eventos sin titulo', async () => {
    const repository = new ResidentAgendaRepositoryStub();
    const residentsService = new ResidentsServiceStub();
    const service = new ResidentAgendaService(
      repository,
      residentsService as unknown as ResidentsService,
    );

    await expect(
      service.create(
        residentsService.resident.id,
        buildInput({ title: '   ' }),
        'Sofia Quiroga',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('trimea titulo y descripcion, y normaliza scheduledAt a ISO', async () => {
    const repository = new ResidentAgendaRepositoryStub();
    const residentsService = new ResidentsServiceStub();
    const service = new ResidentAgendaService(
      repository,
      residentsService as unknown as ResidentsService,
    );

    await service.create(
      residentsService.resident.id,
      buildInput({ title: '  Clase de yoga  ', description: '  con Ana  ' }),
      'Sofia Quiroga',
    );

    expect(repository.lastCreate?.input.title).toBe('Clase de yoga');
    expect(repository.lastCreate?.input.description).toBe('con Ana');
  });
});

describe('ResidentAgendaService.update', () => {
  it('actualiza un evento futuro del residente', async () => {
    const repository = new ResidentAgendaRepositoryStub();
    const residentsService = new ResidentsServiceStub();
    const service = new ResidentAgendaService(
      repository,
      residentsService as unknown as ResidentsService,
    );

    await service.create(
      residentsService.resident.id,
      buildInput(),
      'Sofia Quiroga',
    );

    const newScheduledAt = new Date(
      FIXED_NOW.getTime() + 2 * ONE_DAY_MS,
    ).toISOString();

    const updated = await service.update(
      residentsService.resident.id,
      'agenda-event-001',
      {
        title: 'Dar medicacion (reprogramado)',
        description: undefined,
        scheduledAt: newScheduledAt,
      },
      'Sofia Quiroga',
    );

    expect(updated.title).toBe('Dar medicacion (reprogramado)');
    expect(updated.scheduledAt).toBe(newScheduledAt);
    expect(repository.lastUpdate?.eventId).toBe('agenda-event-001');
  });

  it('rechaza actualizar un evento que ya ocurrio', async () => {
    const repository = new ResidentAgendaRepositoryStub();
    const residentsService = new ResidentsServiceStub();
    const service = new ResidentAgendaService(
      repository,
      residentsService as unknown as ResidentsService,
    );

    // Sembrar manualmente un evento en el pasado (saltando la validación).
    repository.stored.push({
      id: 'agenda-past-001' as ResidentAgendaEvent['id'],
      residentId: residentsService.resident.id as ResidentAgendaEvent['residentId'],
      title: 'Viejo',
      description: undefined,
      scheduledAt: new Date(FIXED_NOW.getTime() - ONE_HOUR_MS).toISOString(),
      audit: {
        createdAt: FIXED_NOW.toISOString(),
        updatedAt: FIXED_NOW.toISOString(),
        createdBy: 'seed',
        updatedBy: 'seed',
      },
    });

    await expect(
      service.update(
        residentsService.resident.id,
        'agenda-past-001',
        {
          title: 'Nuevo',
          description: undefined,
          scheduledAt: new Date(FIXED_NOW.getTime() + ONE_HOUR_MS).toISOString(),
        },
        'Sofia Quiroga',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza actualizar un evento que pertenece a otro residente', async () => {
    const repository = new ResidentAgendaRepositoryStub();
    const residentsService = new ResidentsServiceStub();
    const service = new ResidentAgendaService(
      repository,
      residentsService as unknown as ResidentsService,
    );

    repository.stored.push({
      id: 'agenda-other-001' as ResidentAgendaEvent['id'],
      residentId: 'otro-residente' as ResidentAgendaEvent['residentId'],
      title: 'Otro',
      description: undefined,
      scheduledAt: new Date(FIXED_NOW.getTime() + ONE_HOUR_MS).toISOString(),
      audit: {
        createdAt: FIXED_NOW.toISOString(),
        updatedAt: FIXED_NOW.toISOString(),
        createdBy: 'seed',
        updatedBy: 'seed',
      },
    });

    await expect(
      service.update(
        residentsService.resident.id,
        'agenda-other-001',
        {
          title: 'Hack',
          description: undefined,
          scheduledAt: new Date(FIXED_NOW.getTime() + ONE_HOUR_MS).toISOString(),
        },
        'Sofia Quiroga',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lanza NotFound si el evento no existe', async () => {
    const repository = new ResidentAgendaRepositoryStub();
    const residentsService = new ResidentsServiceStub();
    const service = new ResidentAgendaService(
      repository,
      residentsService as unknown as ResidentsService,
    );

    await expect(
      service.update(
        residentsService.resident.id,
        'nope',
        {
          title: 'x',
          description: undefined,
          scheduledAt: new Date(FIXED_NOW.getTime() + ONE_HOUR_MS).toISOString(),
        },
        'Sofia Quiroga',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('ResidentAgendaService.delete', () => {
  it('soft-deletea un evento y refresca auditoria', async () => {
    const repository = new ResidentAgendaRepositoryStub();
    const residentsService = new ResidentsServiceStub();
    const service = new ResidentAgendaService(
      repository,
      residentsService as unknown as ResidentsService,
    );

    await service.create(
      residentsService.resident.id,
      buildInput(),
      'Sofia Quiroga',
    );

    await service.delete(
      residentsService.resident.id,
      'agenda-event-001',
      'Sofia Quiroga',
    );

    expect(repository.lastDelete?.eventId).toBe('agenda-event-001');
    expect(residentsService.touchedAudit).toEqual({
      residentId: residentsService.resident.id,
      actor: 'Sofia Quiroga',
      organizationId: residentsService.resident.organizationId,
    });
  });
});

describe('ResidentAgendaService.listUpcomingByResidentId', () => {
  it('lista solo eventos futuros ordenados ascendentemente', async () => {
    const repository = new ResidentAgendaRepositoryStub();
    const residentsService = new ResidentsServiceStub();
    const service = new ResidentAgendaService(
      repository,
      residentsService as unknown as ResidentsService,
    );

    const residentId = residentsService.resident.id as ResidentAgendaEvent['residentId'];
    repository.stored.push(
      {
        id: 'past' as ResidentAgendaEvent['id'],
        residentId,
        title: 'past',
        description: undefined,
        scheduledAt: new Date(FIXED_NOW.getTime() - ONE_HOUR_MS).toISOString(),
        audit: {
          createdAt: FIXED_NOW.toISOString(),
          updatedAt: FIXED_NOW.toISOString(),
          createdBy: 'seed',
          updatedBy: 'seed',
        },
      },
      {
        id: 'future-later' as ResidentAgendaEvent['id'],
        residentId,
        title: 'later',
        description: undefined,
        scheduledAt: new Date(FIXED_NOW.getTime() + 5 * ONE_HOUR_MS).toISOString(),
        audit: {
          createdAt: FIXED_NOW.toISOString(),
          updatedAt: FIXED_NOW.toISOString(),
          createdBy: 'seed',
          updatedBy: 'seed',
        },
      },
      {
        id: 'future-sooner' as ResidentAgendaEvent['id'],
        residentId,
        title: 'sooner',
        description: undefined,
        scheduledAt: new Date(FIXED_NOW.getTime() + ONE_HOUR_MS).toISOString(),
        audit: {
          createdAt: FIXED_NOW.toISOString(),
          updatedAt: FIXED_NOW.toISOString(),
          createdBy: 'seed',
          updatedBy: 'seed',
        },
      },
    );

    const result = await service.listUpcomingByResidentId(
      residentsService.resident.id,
    );

    expect(result.map((event) => event.id)).toEqual([
      'future-sooner',
      'future-later',
    ]);
  });
});
