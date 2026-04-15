import { Injectable } from '@nestjs/common';

import type { Resident } from '@gentrix/domain-residents';
import { toIsoDateString } from '@gentrix/shared-utils';

import { seedResidents } from '../../../../../common/persistence/in-memory-seed';
import type {
  ResidentCareStatusUpdateRecordInput,
  ResidentRepository,
} from '../../../domain/repositories/resident.repository';

@Injectable()
export class InMemoryResidentRepository implements ResidentRepository {
  private readonly residents: Resident[] = seedResidents.map(cloneResident);

  async list(organizationId?: string): Promise<Resident[]> {
    return this.residents
      .filter((resident) =>
        organizationId ? resident.organizationId === organizationId : true,
      )
      .map(cloneResident);
  }

  async findById(
    id: string,
    organizationId?: string,
  ): Promise<Resident | null> {
    const resident = this.residents.find(
      (candidate) =>
        candidate.id === id &&
        (organizationId ? candidate.organizationId === organizationId : true),
    );

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

  async touchAudit(
    residentId: Resident['id'],
    actor: string,
    organizationId?: Resident['organizationId'],
  ): Promise<void> {
    const residentIndex = this.residents.findIndex(
      (candidate) =>
        candidate.id === residentId &&
        (organizationId ? candidate.organizationId === organizationId : true),
    );

    if (residentIndex === -1) {
      return;
    }

    this.residents[residentIndex] = {
      ...this.residents[residentIndex],
      audit: {
        ...this.residents[residentIndex].audit,
        updatedAt: toIsoDateString(new Date()),
        updatedBy: actor,
      },
    };
  }

  async setCareStatus(
    input: ResidentCareStatusUpdateRecordInput,
  ): Promise<Resident> {
    const residentIndex = this.residents.findIndex(
      (candidate) =>
        candidate.id === input.residentId &&
        candidate.organizationId === input.organizationId,
    );

    if (residentIndex === -1) {
      throw new Error(`Resident ${input.residentId} not found.`);
    }

    const current = this.residents[residentIndex];
    const updated: Resident = {
      ...current,
      careStatus: input.toStatus,
      careStatusChangedAt: input.changedAt,
      careStatusChangedBy: input.actor,
      audit: {
        ...current.audit,
        updatedAt: input.changedAt,
        updatedBy: input.actor,
      },
    };

    this.residents.splice(residentIndex, 1, updated);
    return cloneResident(updated);
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
    geriatricAssessment: { ...resident.geriatricAssessment },
    belongings: { ...resident.belongings },
    familyContacts: resident.familyContacts.map((contact) => ({ ...contact })),
    discharge: { ...resident.discharge },
    address: { ...resident.address },
    emergencyContact: { ...resident.emergencyContact },
    audit: { ...resident.audit },
  };
}
