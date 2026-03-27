import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  isMedicationActive,
  toMedicationOverview,
} from '@gentrix/domain-medication';
import {
  toResidentDetail,
  type Resident,
} from '@gentrix/domain-residents';
import type {
  ResidentDetail,
  ResidentEvent,
  ResidentLiveProfile,
  ResidentLiveProfileResident,
} from '@gentrix/shared-types';

import {
  MEDICATION_REPOSITORY,
  type MedicationRepository,
} from '../../medication/domain/repositories/medication.repository';
import {
  RESIDENT_REPOSITORY,
  type ResidentRepository,
} from '../domain/repositories/resident.repository';

const recentResidentEventsLimit = 5;

@Injectable()
export class ResidentLiveProfileQueryService {
  constructor(
    @Inject(RESIDENT_REPOSITORY)
    private readonly residents: ResidentRepository,
    @Inject(MEDICATION_REPOSITORY)
    private readonly medications: MedicationRepository,
  ) {}

  async getResidentLiveProfile(
    residentId: string,
    organizationId?: Resident['organizationId'],
  ): Promise<ResidentLiveProfile> {
    const resident = await this.residents.findById(residentId, organizationId);

    if (!resident) {
      throw new NotFoundException('No encontre el residente solicitado.');
    }

    const residentDetail = toResidentDetail(resident);
    const [residentEvents, residentMedications] = await Promise.all([
      this.residents.listEventsByResidentId(resident.id, resident.organizationId),
      this.medications.listByResidentId(resident.id, resident.organizationId),
    ]);

    return {
      resident: toResidentLiveProfileResident(residentDetail),
      activeMedications: residentMedications
        .filter((order) => isMedicationActive(order))
        .map((order) => toMedicationOverview(order, residentDetail.fullName)),
      recentEvents: sortResidentEventsDesc(residentEvents).slice(
        0,
        recentResidentEventsLimit,
      ),
    };
  }
}

function toResidentLiveProfileResident(
  resident: ResidentDetail,
): ResidentLiveProfileResident {
  return {
    id: resident.id,
    fullName: resident.fullName,
    age: resident.age,
    internalNumber: resident.internalNumber,
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
    status: resident.status,
  };
}

function sortResidentEventsDesc(events: ResidentEvent[]): ResidentEvent[] {
  return [...events].sort(
    (left, right) =>
      new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
  );
}
