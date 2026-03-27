import { describe, expect, it } from 'vitest';

import {
  createResidentSeed,
  type Resident,
} from '@gentrix/domain-residents';
import type { ResidentUpdateInput } from '@gentrix/shared-types';

import type { ResidentRepository } from '../domain/repositories/resident.repository';
import { ResidentsService } from './residents.service';

class ResidentRepositoryStub implements ResidentRepository {
  private resident: Resident;
  lastUpdatedResident: Resident | null = null;

  constructor(resident: Resident) {
    this.resident = cloneResident(resident);
  }

  async list(): Promise<Resident[]> {
    return [cloneResident(this.resident)];
  }

  async findById(id: string): Promise<Resident | null> {
    return this.resident.id === id ? cloneResident(this.resident) : null;
  }

  async create(resident: Resident): Promise<Resident> {
    this.resident = cloneResident(resident);
    return cloneResident(this.resident);
  }

  async update(resident: Resident): Promise<Resident> {
    this.lastUpdatedResident = cloneResident(resident);
    this.resident = cloneResident(resident);
    return cloneResident(this.resident);
  }
}

describe('ResidentsService.updateResident', () => {
  it('preserves supporting record ids when only base data changes', async () => {
    const resident = createResidentSeed({
      attachments: [
        {
          id: 'resident-attachment-001',
          fileName: 'consentimiento.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 2048,
          dataUrl: 'data:application/pdf;base64,ZmFrZQ==',
          kind: 'pdf',
          uploadedAt: '2026-01-10T09:00:00.000Z',
        },
      ],
      familyContacts: [
        {
          id: 'resident-family-contact-001',
          fullName: 'Laura Perez',
          relationship: 'Hija',
          phone: '+54 11 5555-0101',
          email: 'laura.perez@familia.local',
          address: 'Paysandu 1402, CABA',
          notes: 'Coordina tramites y acompanamiento en consultas.',
        },
      ],
      medicalHistory: [
        {
          id: 'resident-history-001',
          recordedAt: '2025-11-12T00:00:00.000Z',
          title: 'Hipertension arterial',
          notes: 'Controlada con seguimiento ambulatorio.',
          createdAt: '2026-01-10T09:00:00.000Z',
        },
      ],
    });
    const residents = new ResidentRepositoryStub(resident);
    const service = new ResidentsService(residents);

    const updated = await service.updateResident(
      resident.id,
      buildResidentUpdateInput(resident, {
        email: 'marta.diaz@nuevo-mail.local',
        room: 'B-204',
      }),
      'coordinator-user',
      resident.organizationId,
    );

    expect(updated.email).toBe('marta.diaz@nuevo-mail.local');
    expect(updated.room).toBe('B-204');
    expect(updated.medicalHistory.map((entry) => entry.id)).toEqual(
      resident.medicalHistory.map((entry) => entry.id),
    );
    expect(updated.attachments.map((attachment) => attachment.id)).toEqual(
      resident.attachments.map((attachment) => attachment.id),
    );
    expect(updated.familyContacts.map((contact) => contact.id)).toEqual(
      resident.familyContacts.map((contact) => contact.id),
    );
    expect(residents.lastUpdatedResident?.medicalHistory).toEqual(
      resident.medicalHistory,
    );
    expect(residents.lastUpdatedResident?.attachments).toEqual(
      resident.attachments,
    );
    expect(residents.lastUpdatedResident?.familyContacts).toEqual(
      resident.familyContacts,
    );
  });
});

function buildResidentUpdateInput(
  resident: Resident,
  overrides: Partial<ResidentUpdateInput> = {},
): ResidentUpdateInput {
  return {
    firstName: resident.firstName,
    middleNames: resident.middleNames,
    lastName: resident.lastName,
    otherLastNames: resident.otherLastNames,
    documentType: resident.documentType,
    documentNumber: resident.documentNumber,
    documentIssuingCountry: resident.documentIssuingCountry,
    procedureNumber: resident.procedureNumber,
    cuil: resident.cuil,
    birthDate: resident.birthDate,
    admissionDate: resident.admissionDate,
    sex: resident.sex,
    maritalStatus: resident.maritalStatus,
    nationality: resident.nationality,
    email: resident.email,
    room: resident.room,
    careLevel: resident.careLevel,
    ...overrides,
  };
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
