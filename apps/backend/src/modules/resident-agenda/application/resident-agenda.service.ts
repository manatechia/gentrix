import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  EntityId,
  ResidentAgendaEvent,
  ResidentAgendaEventCreateInput,
  ResidentAgendaEventUpdateInput,
  ResidentAgendaEventWithResident,
} from '@gentrix/shared-types';

import { ResidentsService } from '../../residents/application/residents.service';
import {
  RESIDENT_AGENDA_REPOSITORY,
  type ResidentAgendaRepository,
} from '../domain/repositories/resident-agenda.repository';

/**
 * Lógica de dominio de la agenda por residente (RF-01..RF-09 del SDD).
 *
 * Reglas transversales:
 *  - Sólo se aceptan eventos futuros (RF-07). Aplica al crear y al mover un
 *    evento existente hacia una nueva fecha.
 *  - Todo cambio actualiza la auditoría (`updatedAt`/`updatedBy`) del propio
 *    evento y también la del residente, manteniendo la convención del
 *    módulo de residentes (crear/editar eventos marca actividad en la ficha).
 *  - Las listas excluyen eventos pasados y soft-deleted. Los eventos pasados
 *    quedan fuera del alcance de la V1 (ver mejoras futuras en el SDD).
 */
@Injectable()
export class ResidentAgendaService {
  constructor(
    @Inject(RESIDENT_AGENDA_REPOSITORY)
    private readonly agendaRepository: ResidentAgendaRepository,
    @Inject(ResidentsService)
    private readonly residentsService: ResidentsService,
  ) {}

  async listUpcomingByResidentId(
    residentId: string,
    organizationId?: string,
  ): Promise<ResidentAgendaEvent[]> {
    const resident = await this.residentsService.getResidentEntityById(
      residentId,
      organizationId,
    );

    return this.agendaRepository.listUpcomingByResidentId(
      resident.id,
      new Date(),
      resident.organizationId,
    );
  }

  async listUpcomingByOrganization(
    organizationId: EntityId,
    limit = 20,
  ): Promise<ResidentAgendaEventWithResident[]> {
    return this.agendaRepository.listUpcomingByOrganization(
      organizationId,
      new Date(),
      clampLimit(limit),
    );
  }

  async create(
    residentId: string,
    input: ResidentAgendaEventCreateInput,
    actor: string,
    organizationId?: string,
  ): Promise<ResidentAgendaEvent> {
    const resident = await this.residentsService.getResidentEntityById(
      residentId,
      organizationId,
    );

    const normalized = this.validateAndNormalize(input);

    const created = await this.agendaRepository.create(
      resident.id,
      normalized,
      actor,
    );

    await this.residentsService.touchResidentAudit(
      resident.id,
      actor,
      resident.organizationId,
    );

    return created;
  }

  async update(
    residentId: string,
    eventId: string,
    input: ResidentAgendaEventUpdateInput,
    actor: string,
    organizationId?: string,
  ): Promise<ResidentAgendaEvent> {
    const resident = await this.residentsService.getResidentEntityById(
      residentId,
      organizationId,
    );
    const existing = await this.getOwnedEvent(
      eventId,
      resident.id,
      resident.organizationId,
    );

    // Si el evento ya había pasado no lo permitimos editar: queda como
    // histórico y el personal debería crear uno nuevo si aplica.
    if (new Date(existing.scheduledAt).getTime() <= Date.now()) {
      throw new BadRequestException(
        'No se puede editar un evento de agenda que ya ocurrió.',
      );
    }

    const normalized = this.validateAndNormalize(input);

    const updated = await this.agendaRepository.update(
      existing.id,
      normalized,
      actor,
      resident.organizationId,
    );

    await this.residentsService.touchResidentAudit(
      resident.id,
      actor,
      resident.organizationId,
    );

    return updated;
  }

  async delete(
    residentId: string,
    eventId: string,
    actor: string,
    organizationId?: string,
  ): Promise<void> {
    const resident = await this.residentsService.getResidentEntityById(
      residentId,
      organizationId,
    );
    const existing = await this.getOwnedEvent(
      eventId,
      resident.id,
      resident.organizationId,
    );

    await this.agendaRepository.softDelete(
      existing.id,
      actor,
      resident.organizationId,
    );

    await this.residentsService.touchResidentAudit(
      resident.id,
      actor,
      resident.organizationId,
    );
  }

  /**
   * Carga el evento y confirma que pertenece al residente/organización del
   * request. Aplica defensa contra IDs cruzados entre residentes u orgs.
   */
  private async getOwnedEvent(
    eventId: string,
    residentId: EntityId,
    organizationId: EntityId,
  ): Promise<ResidentAgendaEvent> {
    const event = await this.agendaRepository.findById(
      eventId as EntityId,
      organizationId,
    );

    if (!event) {
      throw new NotFoundException('No encontre el evento de agenda.');
    }

    if (event.residentId !== residentId) {
      throw new ForbiddenException(
        'El evento de agenda no pertenece a este residente.',
      );
    }

    return event;
  }

  private validateAndNormalize<T extends ResidentAgendaEventCreateInput>(
    input: T,
  ): T {
    const title = input.title.trim();
    const description = input.description?.trim();
    const scheduledDate = new Date(input.scheduledAt);

    if (title.length === 0) {
      throw new BadRequestException('El evento debe tener un titulo.');
    }

    if (Number.isNaN(scheduledDate.getTime())) {
      throw new BadRequestException(
        'La fecha y hora del evento no tiene un formato valido.',
      );
    }

    if (scheduledDate.getTime() <= Date.now()) {
      throw new BadRequestException(
        'La fecha y hora del evento debe estar en el futuro.',
      );
    }

    return {
      ...input,
      title,
      description: description && description.length > 0 ? description : undefined,
      scheduledAt: scheduledDate.toISOString(),
    };
  }
}

function clampLimit(limit: number): number {
  if (!Number.isFinite(limit) || limit <= 0) {
    return 20;
  }

  return Math.min(100, Math.floor(limit));
}
