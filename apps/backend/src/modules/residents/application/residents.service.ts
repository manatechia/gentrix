import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  createResidentFromIntake,
  isResidentGeriatricAssessmentLevel,
  toResidentCard,
  toResidentDetail,
  updateResidentBaseProfile,
  type Resident,
} from '@gentrix/domain-residents';
import type {
  ResidentCareStatus,
  ResidentCreateInput,
  ResidentDetail,
  ResidentDischargeInfo,
  ResidentEvent,
  ResidentEventCreateInput,
  ResidentGeriatricAssessment,
  ResidentObservation,
  ResidentObservationCreateInput,
  ResidentObservationEntryCreateInput,
  ResidentObservationResolveInput,
  ResidentOverview,
  ResidentSupportingRecordInput,
  ResidentUpdateInput,
} from '@gentrix/shared-types';
import { toIsoDateString } from '@gentrix/shared-utils';

import { assertTransition } from '../domain/policies/care-status.policy';
import {
  RESIDENT_REPOSITORY,
  type ResidentEventRecordInput,
  type ResidentObservationEntryRecordInput,
  type ResidentObservationRecordInput,
  type ResidentObservationResolveRecordInput,
  type ResidentRepository,
} from '../domain/repositories/resident.repository';

/**
 * Resultado del cambio de estado clínico operativo. `changed` indica si la
 * transición efectivamente ocurrió. Pasamos `false` cuando el residente ya se
 * encontraba en el estado destino — caso modelado como no-op silencioso para
 * que el flujo "crear evento + poner en observación" sea idempotente.
 */
export interface ResidentCareStatusChangeResult {
  resident: ResidentDetail;
  changed: boolean;
  fromStatus: ResidentCareStatus;
  toStatus: ResidentCareStatus;
}

@Injectable()
export class ResidentsService {
  constructor(
    @Inject(RESIDENT_REPOSITORY)
    private readonly residents: ResidentRepository,
  ) {}

  async getResidents(organizationId?: string): Promise<ResidentOverview[]> {
    return (await this.residents.list(organizationId)).map(toResidentCard);
  }

  async getResidentEntities(organizationId?: string): Promise<Resident[]> {
    return this.residents.list(organizationId);
  }

  async getResidentEntityById(
    id: string,
    organizationId?: string,
  ): Promise<Resident> {
    const resident = await this.residents.findById(id, organizationId);

    if (!resident) {
      throw new NotFoundException('No encontre el residente solicitado.');
    }

    return resident;
  }

  async getResidentById(id: string, organizationId?: string): Promise<ResidentDetail> {
    const resident = await this.getResidentEntityById(id, organizationId);
    return toResidentDetail(resident);
  }

  async getResidentEvents(
    residentId: string,
    organizationId?: Resident['organizationId'],
  ): Promise<ResidentEvent[]> {
    const resident = await this.getResidentEntityById(residentId, organizationId);
    const events = await this.residents.listEventsByResidentId(
      resident.id,
      resident.organizationId,
    );

    return sortResidentEventsDesc(events);
  }

  async createResident(
    input: ResidentCreateInput,
    actor: string,
    organizationId: Resident['organizationId'],
    facilityId: Resident['facilityId'],
  ): Promise<ResidentOverview> {
    this.validateResidentCreateInput(input);
    const resident = createResidentFromIntake(input, organizationId, facilityId);
    resident.audit.createdBy = actor;
    resident.audit.updatedBy = actor;
    const created = await this.residents.create(resident);
    return toResidentCard(created);
  }

  async updateResident(
    id: string,
    input: ResidentUpdateInput,
    actor: string,
    organizationId?: Resident['organizationId'],
  ): Promise<ResidentDetail> {
    const currentResident = await this.residents.findById(id, organizationId);

    if (!currentResident) {
      throw new NotFoundException('No encontre el residente solicitado.');
    }

    this.validateResidentUpdateInput(input);
    const updatedResident = updateResidentBaseProfile(currentResident, input, actor);
    const persistedResident = await this.residents.update(updatedResident);
    return toResidentDetail(persistedResident);
  }

  async touchResidentAudit(
    residentId: string,
    actor: string,
    organizationId?: Resident['organizationId'],
  ): Promise<void> {
    const resident = await this.getResidentEntityById(residentId, organizationId);
    await this.residents.touchAudit(resident.id, actor, resident.organizationId);
  }

  /**
   * Cambia el estado clínico operativo del residente.
   *
   * Reglas de negocio:
   *  - Si la transición coincide con el estado actual: no-op silencioso
   *    (`changed: false`). No se toca auditoría ni se devuelve error.
   *  - Si la transición no está declarada en `RESIDENT_CARE_STATUS_TRANSITIONS`
   *    se lanza BadRequestException antes de tocar el repositorio.
   *  - Caso contrario, se actualiza el residente y su auditoría
   *    (`updatedAt`/`updatedBy`) en una sola operación.
   *
   * Auditoría dedicada: por ahora reutilizamos `updatedBy/updatedAt` del
   * residente. La tabla de auditoría histórica de transiciones quedó como
   * deuda técnica documentada en
   * docs/tech-debt/resident-care-status-audit.md
   */
  async setResidentCareStatus(
    residentId: string,
    toStatus: ResidentCareStatus,
    actor: string,
    organizationId?: Resident['organizationId'],
  ): Promise<ResidentCareStatusChangeResult> {
    const resident = await this.getResidentEntityById(residentId, organizationId);
    const fromStatus = resident.careStatus;

    if (fromStatus === toStatus) {
      return {
        resident: toResidentDetail(resident),
        changed: false,
        fromStatus,
        toStatus,
      };
    }

    assertTransition(fromStatus, toStatus);

    const persisted = await this.residents.setCareStatus({
      residentId: resident.id,
      organizationId: resident.organizationId,
      toStatus,
      actor,
      changedAt: toIsoDateString(new Date()),
    });

    return {
      resident: toResidentDetail(persisted),
      changed: true,
      fromStatus,
      toStatus,
    };
  }

  async getResidentsByCareStatus(
    careStatus: ResidentCareStatus,
    organizationId?: Resident['organizationId'],
  ): Promise<ResidentOverview[]> {
    const residents = await this.residents.list(organizationId);
    return residents
      .filter((resident) => resident.careStatus === careStatus)
      .map(toResidentCard);
  }

  async createResidentEvent(
    residentId: string,
    input: ResidentEventCreateInput,
    actor: string,
    organizationId?: Resident['organizationId'],
  ): Promise<ResidentEvent> {
    const resident = await this.getResidentEntityById(residentId, organizationId);

    this.validateResidentEventCreateInput(input);

    const now = toIsoDateString(new Date());
    const eventRecord: ResidentEventRecordInput = {
      residentId: resident.id,
      organizationId: resident.organizationId,
      facilityId: resident.facilityId,
      eventType: input.eventType,
      title: input.title.trim(),
      description: input.description.trim(),
      occurredAt: toIsoDateString(input.occurredAt),
      actor,
      createdAt: now,
    };

    const createdEvent = await this.residents.createEvent(eventRecord);
    await this.residents.touchAudit(resident.id, actor, resident.organizationId);
    return createdEvent;
  }

  async getResidentObservations(
    residentId: string,
    organizationId?: Resident['organizationId'],
  ): Promise<ResidentObservation[]> {
    const resident = await this.getResidentEntityById(residentId, organizationId);
    const observations = await this.residents.listObservationsByResidentId(
      resident.id,
      resident.organizationId,
    );

    return sortResidentObservations(observations);
  }

  async createResidentObservation(
    residentId: string,
    input: ResidentObservationCreateInput,
    actor: string,
    organizationId?: Resident['organizationId'],
  ): Promise<ResidentObservation> {
    const resident = await this.getResidentEntityById(residentId, organizationId);
    this.validateResidentObservationCreateInput(input);

    const now = toIsoDateString(new Date());
    const observationRecord: ResidentObservationRecordInput = {
      residentId: resident.id,
      organizationId: resident.organizationId,
      severity: input.severity,
      title: input.title.trim(),
      description: input.description.trim(),
      actor,
      openedAt: now,
    };

    const createdObservation = await this.residents.createObservation(
      observationRecord,
    );
    await this.residents.touchAudit(resident.id, actor, resident.organizationId);
    return createdObservation;
  }

  async createResidentObservationEntry(
    residentId: string,
    observationId: string,
    input: ResidentObservationEntryCreateInput,
    actor: string,
    organizationId?: Resident['organizationId'],
  ): Promise<ResidentObservation> {
    const resident = await this.getResidentEntityById(residentId, organizationId);
    this.validateResidentObservationEntryCreateInput(input);
    const observation = await this.getResidentObservationEntity(
      observationId,
      resident,
    );

    if (observation.status !== 'active') {
      throw new BadRequestException(
        'La observacion ya fue cerrada y no admite nuevos seguimientos.',
      );
    }

    const now = toIsoDateString(new Date());
    const entryRecord: ResidentObservationEntryRecordInput = {
      observationId: observation.id,
      residentId: resident.id,
      organizationId: resident.organizationId,
      entryType: input.entryType,
      title: input.title.trim(),
      description: input.description.trim(),
      actor,
      occurredAt: now,
    };

    const updatedObservation = await this.residents.createObservationEntry(
      entryRecord,
    );
    await this.residents.touchAudit(resident.id, actor, resident.organizationId);
    return updatedObservation;
  }

  async resolveResidentObservation(
    residentId: string,
    observationId: string,
    input: ResidentObservationResolveInput,
    actor: string,
    organizationId?: Resident['organizationId'],
  ): Promise<ResidentObservation> {
    const resident = await this.getResidentEntityById(residentId, organizationId);
    this.validateResidentObservationResolveInput(input);
    const observation = await this.getResidentObservationEntity(
      observationId,
      resident,
    );

    if (observation.status !== 'active') {
      throw new BadRequestException('La observacion ya estaba resuelta.');
    }

    const now = toIsoDateString(new Date());
    const resolutionRecord: ResidentObservationResolveRecordInput = {
      observationId: observation.id,
      residentId: resident.id,
      organizationId: resident.organizationId,
      resolutionType: input.resolutionType,
      summary: input.summary.trim(),
      actor,
      resolvedAt: now,
    };

    const updatedObservation = await this.residents.resolveObservation(
      resolutionRecord,
    );
    await this.residents.touchAudit(resident.id, actor, resident.organizationId);
    return updatedObservation;
  }

  private validateResidentCreateInput(input: ResidentCreateInput): void {
    this.validateResidentBaseProfile(input);
    this.validateResidentSupportingRecords(input);
    this.validateResidentGeriatricAssessment(input.geriatricAssessment);
    this.validateResidentDischarge(input.admissionDate, input.discharge);
  }

  private validateResidentUpdateInput(input: ResidentUpdateInput): void {
    this.validateResidentBaseProfile(input);
    this.validateResidentGeriatricAssessment(input.geriatricAssessment);
  }

  private validateResidentEventCreateInput(input: ResidentEventCreateInput): void {
    const occurredAt = new Date(input.occurredAt);

    if (Number.isNaN(occurredAt.getTime())) {
      throw new BadRequestException(
        'La fecha del evento no tiene un formato valido.',
      );
    }

    if (input.title.trim().length === 0) {
      throw new BadRequestException('El evento debe tener un titulo.');
    }

    if (input.description.trim().length === 0) {
      throw new BadRequestException('El evento debe tener una descripcion.');
    }

    if (occurredAt.getTime() > Date.now()) {
      throw new BadRequestException(
        'La fecha del evento no puede estar en el futuro.',
      );
    }
  }

  private validateResidentObservationCreateInput(
    input: ResidentObservationCreateInput,
  ): void {
    if (input.title.trim().length === 0) {
      throw new BadRequestException('La observacion debe tener un titulo.');
    }

    if (input.description.trim().length === 0) {
      throw new BadRequestException(
        'La observacion debe tener un detalle operativo.',
      );
    }
  }

  private validateResidentObservationEntryCreateInput(
    input: ResidentObservationEntryCreateInput,
  ): void {
    if (input.title.trim().length === 0) {
      throw new BadRequestException('El seguimiento debe tener un titulo.');
    }

    if (input.description.trim().length === 0) {
      throw new BadRequestException('El seguimiento debe tener un detalle.');
    }
  }

  private validateResidentObservationResolveInput(
    input: ResidentObservationResolveInput,
  ): void {
    if (input.summary.trim().length === 0) {
      throw new BadRequestException('El cierre requiere un resumen final.');
    }
  }

  private async getResidentObservationEntity(
    observationId: string,
    resident: Resident,
  ): Promise<ResidentObservation> {
    const observation = await this.residents.findObservationById(
      observationId as ResidentObservation['id'],
      resident.id,
      resident.organizationId,
    );

    if (!observation) {
      throw new NotFoundException('No encontre la observacion solicitada.');
    }

    return observation;
  }

  private validateResidentBaseProfile(
    input: ResidentCreateInput | ResidentUpdateInput,
  ): void {
    const today = new Date().toISOString().slice(0, 10);
    const birthDay = new Date(input.birthDate).toISOString().slice(0, 10);
    const admissionDay = new Date(input.admissionDate).toISOString().slice(0, 10);

    if (birthDay > today) {
      throw new BadRequestException(
        'La fecha de nacimiento no puede estar en el futuro.',
      );
    }

    if (admissionDay > today) {
      throw new BadRequestException(
        'La fecha de ingreso no puede estar en el futuro.',
      );
    }
  }

  private validateResidentSupportingRecords(input: ResidentSupportingRecordInput): void {
    const today = new Date().toISOString().slice(0, 10);

    if ('medicalHistory' in input) {
      for (const entry of input.medicalHistory) {
        const recordedDay = new Date(entry.recordedAt).toISOString().slice(0, 10);

        if (recordedDay > today) {
          throw new BadRequestException(
            'Los antecedentes medicos no pueden tener una fecha futura.',
          );
        }
      }
    }

    for (const attachment of input.attachments) {
      const mimeType = attachment.mimeType.trim().toLowerCase();
      const isAllowedMimeType =
        mimeType === 'application/pdf' || mimeType.startsWith('image/');

      if (!isAllowedMimeType) {
        throw new BadRequestException(
          'Solo se permiten adjuntos en formato imagen o PDF.',
        );
      }

      if (!attachment.dataUrl.startsWith(`data:${mimeType};base64,`)) {
        throw new BadRequestException(
          'El contenido del adjunto no coincide con el tipo de archivo informado.',
        );
      }
    }
  }

  private validateResidentDischarge(
    admissionDate: string,
    discharge: ResidentDischargeInfo,
  ): void {
    const today = new Date().toISOString().slice(0, 10);
    const admissionDay = new Date(admissionDate).toISOString().slice(0, 10);

    if (discharge.date) {
      const dischargeDay = new Date(discharge.date)
        .toISOString()
        .slice(0, 10);

      if (dischargeDay > today) {
        throw new BadRequestException(
          'La fecha de salida no puede estar en el futuro.',
        );
      }

      if (dischargeDay < admissionDay) {
        throw new BadRequestException(
          'La fecha de salida no puede ser anterior a la fecha de ingreso.',
        );
      }
    }
  }

  private validateResidentGeriatricAssessment(
    geriatricAssessment: ResidentGeriatricAssessment,
  ): void {
    const domains = [
      geriatricAssessment.cognition,
      geriatricAssessment.mobility,
      geriatricAssessment.feeding,
      geriatricAssessment.skinIntegrity,
      geriatricAssessment.dependencyLevel,
      geriatricAssessment.mood,
    ];

    for (const domainValue of domains) {
      if (
        domainValue !== undefined &&
        !isResidentGeriatricAssessmentLevel(domainValue)
      ) {
        throw new BadRequestException(
          'La VGI tiene niveles de valoracion no validos.',
        );
      }
    }
  }
}

function sortResidentEventsDesc(events: ResidentEvent[]): ResidentEvent[] {
  return [...events].sort(
    (left, right) =>
      new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
  );
}

function sortResidentObservations(
  observations: ResidentObservation[],
): ResidentObservation[] {
  return [...observations].sort((left, right) => {
    if (left.status !== right.status) {
      return left.status === 'active' ? -1 : 1;
    }

    return (
      resolveObservationActivityTime(right) - resolveObservationActivityTime(left)
    );
  });
}

function resolveObservationActivityTime(observation: ResidentObservation): number {
  const latestEntryAt = observation.entries[0]?.occurredAt;

  return new Date(
    latestEntryAt ?? observation.resolvedAt ?? observation.openedAt,
  ).getTime();
}
