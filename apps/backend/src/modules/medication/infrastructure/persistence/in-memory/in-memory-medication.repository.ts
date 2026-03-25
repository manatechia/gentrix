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
    return this.medications.map(cloneMedicationOrder);
  }

  async findById(id: string): Promise<MedicationOrder | null> {
    const medication = this.medications.find((candidate) => candidate.id === id);

    return medication ? cloneMedicationOrder(medication) : null;
  }

  async create(order: MedicationOrder): Promise<MedicationOrder> {
    const createdOrder = cloneMedicationOrder(order);
    this.medications.unshift(createdOrder);
    return cloneMedicationOrder(createdOrder);
  }

  async update(order: MedicationOrder): Promise<MedicationOrder> {
    const index = this.medications.findIndex((candidate) => candidate.id === order.id);
    const updatedOrder = cloneMedicationOrder(order);

    if (index === -1) {
      this.medications.unshift(updatedOrder);
      return cloneMedicationOrder(updatedOrder);
    }

    this.medications[index] = updatedOrder;
    return cloneMedicationOrder(updatedOrder);
  }
}

function cloneMedicationOrder(order: MedicationOrder): MedicationOrder {
  return {
    ...order,
    scheduleTimes: [...order.scheduleTimes],
    audit: { ...order.audit },
  };
}
