import { Inject, Injectable } from '@nestjs/common';

import { isMedicationActive, type MedicationOrder } from '@gentrix/domain-medication';
import type { MedicationOverview } from '@gentrix/shared-types';

import { ResidentsService } from '../../residents/application/residents.service';
import {
  MEDICATION_REPOSITORY,
  type MedicationRepository,
} from '../domain/repositories/medication.repository';

function formatMedicationFrequency(frequency: string): string {
  const labels: Record<string, string> = {
    daily: 'A diario',
    'twice-daily': 'Dos veces al dia',
    nightly: 'Por la noche',
    'as-needed': 'Segun necesidad',
  };

  return labels[frequency] ?? frequency;
}

@Injectable()
export class MedicationService {
  constructor(
    @Inject(MEDICATION_REPOSITORY)
    private readonly medicationRepository: MedicationRepository,
    @Inject(ResidentsService)
    private readonly residentsService: ResidentsService,
  ) {}

  async getMedications(): Promise<MedicationOverview[]> {
    const [medications, residents] = await Promise.all([
      this.medicationRepository.list(),
      this.residentsService.getResidentEntities(),
    ]);

    const residentNames = new Map(
      residents.map((resident) => [
        resident.id,
        `${resident.firstName} ${resident.lastName}`,
      ]),
    );

    return medications.map((order) => ({
      id: order.id,
      residentId: order.residentId,
      residentName:
        residentNames.get(order.residentId) ?? 'Residente no identificado',
      medicationName: order.medicationName,
      active: isMedicationActive(order),
      schedule: `${formatMedicationFrequency(order.frequency)} a las ${order.scheduleTimes.join(', ')}`,
    }));
  }

  async getMedicationEntities(): Promise<MedicationOrder[]> {
    return this.medicationRepository.list();
  }
}
