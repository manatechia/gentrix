import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  EntityId,
  ResidentObservationNote,
  ResidentObservationNoteCreateInput,
  ResidentObservationNoteCreateResponse,
} from '@gentrix/shared-types';

import { ResidentsService } from '../../residents/application/residents.service';
import {
  RESIDENT_OBSERVATION_NOTES_REPOSITORY,
  type ResidentObservationNotesRepository,
} from '../domain/repositories/resident-observation-notes.repository';

@Injectable()
export class ResidentObservationNotesService {
  constructor(
    @Inject(RESIDENT_OBSERVATION_NOTES_REPOSITORY)
    private readonly repo: ResidentObservationNotesRepository,
    @Inject(ResidentsService)
    private readonly residents: ResidentsService,
  ) {}

  async list(
    residentId: string,
    organizationId: string,
  ): Promise<ResidentObservationNote[]> {
    const resident = await this.residents.getResidentEntityById(
      residentId,
      organizationId,
    );
    return this.repo.listByResidentId(
      resident.id,
      resident.organizationId as EntityId,
    );
  }

  async create(
    residentId: string,
    input: ResidentObservationNoteCreateInput,
    actor: string,
    organizationId: string,
  ): Promise<ResidentObservationNoteCreateResponse> {
    const resident = await this.residents.getResidentEntityById(
      residentId,
      organizationId,
    );
    const trimmed = input.note.trim();
    if (trimmed.length === 0) {
      throw new BadRequestException('La observacion no puede estar vacia.');
    }

    const created = await this.repo.create(
      resident.id,
      { note: trimmed },
      actor,
    );

    let careStatusChanged = false;
    if (input.putUnderObservation) {
      // setResidentCareStatus es no-op silencioso (changed: false) si ya está
      // en_observacion; preservamos esa semántica.
      const result = await this.residents.setResidentCareStatus(
        resident.id,
        'en_observacion',
        actor,
        resident.organizationId,
      );
      careStatusChanged = result.changed;
    } else {
      await this.residents.touchResidentAudit(
        resident.id,
        actor,
        resident.organizationId,
      );
    }

    return { note: created, careStatusChanged };
  }

  async delete(
    residentId: string,
    noteId: string,
    actor: string,
    organizationId: string,
  ): Promise<void> {
    const resident = await this.residents.getResidentEntityById(
      residentId,
      organizationId,
    );
    const existing = await this.repo.findById(
      noteId as EntityId,
      resident.organizationId as EntityId,
    );
    if (!existing) {
      throw new NotFoundException('No encontre la observacion solicitada.');
    }
    if (existing.residentId !== resident.id) {
      throw new ForbiddenException(
        'La observacion no pertenece a este residente.',
      );
    }
    await this.repo.softDelete(
      existing.id,
      actor,
      resident.organizationId as EntityId,
    );
    await this.residents.touchResidentAudit(
      resident.id,
      actor,
      resident.organizationId,
    );
  }
}
