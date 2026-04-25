import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

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
  ResidentCareStatusChangeEvent,
  ResidentCareStatusClosureReason,
  ResidentCreateInput,
  ResidentDetail,
  ResidentDischargeInfo,
  ResidentGeriatricAssessment,
  ResidentOverview,
  ResidentSupportingRecordInput,
  ResidentUpdateInput,
} from '@gentrix/shared-types';
import { toIsoDateString } from '@gentrix/shared-utils';

import {
  assertClosureReason,
  assertTransition,
  isObservationClosure,
} from '../domain/policies/care-status.policy';
import {
  RESIDENT_REPOSITORY,
  type ResidentRepository,
} from '../domain/repositories/resident.repository';

/**
 * Resultado del cambio de estado clínico operativo. `changed` indica si la
 * transición efectivamente ocurrió. Pasamos `false` cuando el residente ya se
 * encontraba en el estado destino — caso modelado como no-op silencioso.
 * `changeEvent` se devuelve solo cuando hubo transición real.
 */
export interface ResidentCareStatusChangeResult {
  resident: ResidentDetail;
  changed: boolean;
  fromStatus: ResidentCareStatus;
  toStatus: ResidentCareStatus;
  changeEvent?: ResidentCareStatusChangeEvent;
}

/**
 * Argumentos del cambio manual de estado clínico operativo. El DTO mapea
 * directamente sobre esta forma; mantener separado del repository input
 * permite que el servicio sume política sin que el repo conozca el catálogo.
 */
export interface SetResidentCareStatusInput {
  toStatus: ResidentCareStatus;
  closureReason?: ResidentCareStatusClosureReason;
  note?: string;
}

@Injectable()
export class ResidentsService {
  constructor(
    @Inject(RESIDENT_REPOSITORY)
    private readonly residents: ResidentRepository,
    @InjectPinoLogger(ResidentsService.name)
    private readonly logger: PinoLogger,
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
    for (const entry of resident.medicalHistory) {
      entry.createdBy = actor;
      entry.updatedBy = actor;
    }
    const created = await this.residents.create(resident);
    this.logger.info(
      {
        residentId: created.id,
        organizationId,
        facilityId,
        careStatus: created.careStatus,
        actor,
      },
      'residents.created',
    );
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
    this.logger.info(
      { residentId: persistedResident.id, organizationId: persistedResident.organizationId, actor },
      'residents.updated',
    );
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
   *  - El cierre formal (`en_observacion -> normal`) requiere
   *    `closureReason` (catálogo `RESIDENT_CARE_STATUS_CLOSURE_REASONS`).
   *  - El residente y su evento auditable se persisten en una transacción.
   */
  async setResidentCareStatus(
    residentId: string,
    input: SetResidentCareStatusInput,
    actor: string,
    organizationId?: Resident['organizationId'],
  ): Promise<ResidentCareStatusChangeResult> {
    const resident = await this.getResidentEntityById(residentId, organizationId);
    const fromStatus = resident.careStatus;
    const { toStatus, closureReason, note } = input;

    if (fromStatus === toStatus) {
      return {
        resident: toResidentDetail(resident),
        changed: false,
        fromStatus,
        toStatus,
      };
    }

    assertTransition(fromStatus, toStatus);
    assertClosureReason(fromStatus, toStatus, closureReason);

    const persisted = await this.residents.setCareStatus({
      residentId: resident.id,
      organizationId: resident.organizationId,
      fromStatus,
      toStatus,
      actor,
      changedAt: toIsoDateString(new Date()),
      closureReason: isObservationClosure(fromStatus, toStatus)
        ? closureReason
        : undefined,
      note: note?.trim() ? note.trim() : undefined,
    });

    this.logger.info(
      {
        residentId: persisted.resident.id,
        organizationId: persisted.resident.organizationId,
        fromStatus,
        toStatus,
        closureReason: persisted.changeEvent.closureReason,
        actor,
      },
      'residents.care-status.changed',
    );

    return {
      resident: toResidentDetail(persisted.resident),
      changed: true,
      fromStatus,
      toStatus,
      changeEvent: persisted.changeEvent,
    };
  }

  /**
   * Devuelve el timeline de transiciones de `careStatus` del residente,
   * ordenado de más antiguo a más nuevo. Verifica el alcance organizacional.
   */
  async listResidentCareStatusChanges(
    residentId: string,
    organizationId?: Resident['organizationId'],
  ): Promise<ResidentCareStatusChangeEvent[]> {
    const resident = await this.getResidentEntityById(
      residentId,
      organizationId,
    );
    return this.residents.listCareStatusChangesByResident(
      resident.id,
      resident.organizationId,
    );
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
