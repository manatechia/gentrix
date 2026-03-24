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
