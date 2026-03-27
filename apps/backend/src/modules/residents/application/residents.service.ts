import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  createResidentFromIntake,
  toResidentCard,
  toResidentDetail,
  updateResidentBaseProfile,
  type Resident,
} from '@gentrix/domain-residents';
import type {
  ResidentCreateInput,
  ResidentDetail,
  ResidentDischargeInfo,
  ResidentEvent,
  ResidentEventCreateInput,
  ResidentOverview,
  ResidentSupportingRecordInput,
  ResidentUpdateInput,
} from '@gentrix/shared-types';
import { toIsoDateString } from '@gentrix/shared-utils';

import {
  RESIDENT_REPOSITORY,
  type ResidentEventRecordInput,
  type ResidentRepository,
} from '../domain/repositories/resident.repository';

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

    return this.residents.createEvent(eventRecord);
  }

  private validateResidentCreateInput(input: ResidentCreateInput): void {
    this.validateResidentBaseProfile(input);
    this.validateResidentSupportingRecords(input);
    this.validateResidentDischarge(input.admissionDate, input.discharge);
  }

  private validateResidentUpdateInput(input: ResidentUpdateInput): void {
    this.validateResidentBaseProfile(input);
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

    for (const entry of input.medicalHistory) {
      const recordedDay = new Date(entry.recordedAt).toISOString().slice(0, 10);

      if (recordedDay > today) {
        throw new BadRequestException(
          'Los antecedentes medicos no pueden tener una fecha futura.',
        );
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
}

function sortResidentEventsDesc(events: ResidentEvent[]): ResidentEvent[] {
  return [...events].sort(
    (left, right) =>
      new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
  );
}
