import { Injectable } from '@nestjs/common';

import type { MedicationOrder } from '@gentrix/domain-medication';

import { seedMedications } from '../../../../../common/persistence/in-memory-seed';
import type { MedicationRepository } from '../../../domain/repositories/medication.repository';

@Injectable()
export class InMemoryMedicationRepository implements MedicationRepository {
  private readonly medications: MedicationOrder[] = seedMedications.map(
    (order) => ({
      ...order,
      scheduleTimes: [...order.scheduleTimes],
      audit: { ...order.audit },
    }),
  );

  async list(): Promise<MedicationOrder[]> {
    return this.medications.map((order) => ({
      ...order,
      scheduleTimes: [...order.scheduleTimes],
      audit: { ...order.audit },
    }));
  }
}
