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
  updateResidentFromIntake,
  type Resident,
} from '@gentrix/domain-residents';
import type {
  ResidentCreateInput,
  ResidentDetail,
  ResidentOverview,
  ResidentUpdateInput,
} from '@gentrix/shared-types';

import {
  RESIDENT_REPOSITORY,
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

  async createResident(
    input: ResidentCreateInput,
    actor: string,
    organizationId: Resident['organizationId'],
    facilityId: Resident['facilityId'],
  ): Promise<ResidentOverview> {
    this.validateResidentInput(input);
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

    this.validateResidentInput(input);
    const updatedResident = updateResidentFromIntake(currentResident, input, actor);
    const persistedResident = await this.residents.update(updatedResident);
    return toResidentDetail(persistedResident);
  }

  private validateResidentInput(
    input: ResidentCreateInput | ResidentUpdateInput,
  ): void {
    this.validateResidentBaseProfile(input);
    this.validateResidentSupportingRecords(input);
    this.validateResidentDischarge(input);
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

  private validateResidentSupportingRecords(
    input: ResidentCreateInput | ResidentUpdateInput,
  ): void {
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
    input: ResidentCreateInput | ResidentUpdateInput,
  ): void {
    const today = new Date().toISOString().slice(0, 10);
    const admissionDay = new Date(input.admissionDate).toISOString().slice(0, 10);

    if (input.discharge.date) {
      const dischargeDay = new Date(input.discharge.date)
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
