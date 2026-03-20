import { Injectable } from '@nestjs/common';

import type { Resident } from '@gentrix/domain-residents';

import { seedResidents } from '../../../../../common/persistence/in-memory-seed';
import type { ResidentRepository } from '../../../domain/repositories/resident.repository';

@Injectable()
export class InMemoryResidentRepository implements ResidentRepository {
  private readonly residents: Resident[] = seedResidents.map(cloneResident);

  async list(): Promise<Resident[]> {
    return this.residents.map(cloneResident);
  }

  async findById(id: string): Promise<Resident | null> {
    const resident = this.residents.find((candidate) => candidate.id === id);

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
}

function cloneResident(resident: Resident): Resident {
  return {
    ...resident,
    medicalHistory: resident.medicalHistory.map((entry) => ({ ...entry })),
    attachments: resident.attachments.map((attachment) => ({ ...attachment })),
    address: { ...resident.address },
    emergencyContact: { ...resident.emergencyContact },
    audit: { ...resident.audit },
  };
}
