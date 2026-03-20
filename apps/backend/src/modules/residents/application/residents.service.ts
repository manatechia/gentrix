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
  type Resident,
} from '@gentrix/domain-residents';
import type {
  ResidentCreateInput,
  ResidentDetail,
  ResidentOverview,
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

  async getResidents(): Promise<ResidentOverview[]> {
    return (await this.residents.list()).map(toResidentCard);
  }

  async getResidentEntities(): Promise<Resident[]> {
    return this.residents.list();
  }

  async getResidentById(id: string): Promise<ResidentDetail> {
    const resident = await this.residents.findById(id);

    if (!resident) {
      throw new NotFoundException('No encontre el residente solicitado.');
    }

    return toResidentDetail(resident);
  }

  async createResident(
    input: ResidentCreateInput,
    actor: string,
  ): Promise<ResidentOverview> {
    const today = new Date().toISOString().slice(0, 10);
    const birthDay = new Date(input.birthDate).toISOString().slice(0, 10);

    if (birthDay > today) {
      throw new BadRequestException(
        'La fecha de nacimiento no puede estar en el futuro.',
      );
    }

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

    const resident = createResidentFromIntake(input);
    resident.audit.createdBy = actor;
    resident.audit.updatedBy = actor;
    const created = await this.residents.create(resident);
    return toResidentCard(created);
  }
}
