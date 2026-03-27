import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  createMedicationFromInput,
  toMedicationDetail,
  toMedicationOverview,
  updateMedicationFromInput,
  type MedicationOrder,
} from '@gentrix/domain-medication';
import type {
  MedicationCatalogItem,
  MedicationCreateInput,
  MedicationDetail,
  MedicationOverview,
  MedicationUpdateInput,
} from '@gentrix/shared-types';

import { ResidentsService } from '../../residents/application/residents.service';
import {
  MEDICATION_CATALOG_REPOSITORY,
  type MedicationCatalogRepository,
} from '../domain/repositories/medication-catalog.repository';
import {
  MEDICATION_REPOSITORY,
  type MedicationRepository,
} from '../domain/repositories/medication.repository';

/**
 * MedicationService manages current prescription orders only.
 * It does not record whether a particular dose was administered, omitted or rejected.
 * That execution layer must be introduced later as a dedicated MedicationExecution
 * model linked to MedicationOrder and then projected into resident read models.
 */
@Injectable()
export class MedicationService {
  constructor(
    @Inject(MEDICATION_REPOSITORY)
    private readonly medicationRepository: MedicationRepository,
    @Inject(MEDICATION_CATALOG_REPOSITORY)
    private readonly medicationCatalogRepository: MedicationCatalogRepository,
    @Inject(ResidentsService)
    private readonly residentsService: ResidentsService,
  ) {}

  async getMedicationCatalog(): Promise<MedicationCatalogItem[]> {
    const catalogItems = await this.medicationCatalogRepository.list();

    return catalogItems.filter((item) => item.status === 'active');
  }

  async getMedications(organizationId?: string): Promise<MedicationOverview[]> {
    const [medications, residents] = await Promise.all([
      this.medicationRepository.list(organizationId),
      this.residentsService.getResidents(organizationId),
    ]);

    const residentNames = new Map(
      residents.map((resident) => [resident.id, resident.fullName]),
    );

    return medications.map((order) =>
      toMedicationOverview(
        order,
        residentNames.get(order.residentId) ?? 'Residente no identificado',
      ),
    );
  }

  async getMedicationById(
    id: string,
    organizationId?: string,
  ): Promise<MedicationDetail> {
    const medication = await this.medicationRepository.findById(id, organizationId);

    if (!medication) {
      throw new NotFoundException('No encontre la medicacion solicitada.');
    }

    const resident = await this.residentsService.getResidentById(
      medication.residentId,
      organizationId,
    );

    return toMedicationDetail(medication, resident.fullName);
  }

  async getMedicationEntities(organizationId?: string): Promise<MedicationOrder[]> {
    return this.medicationRepository.list(organizationId);
  }

  async createMedication(
    input: MedicationCreateInput,
    actor: string,
    organizationId: MedicationOrder['organizationId'],
  ): Promise<MedicationOverview> {
    const createInput: MedicationCreateInput = {
      ...input,
      status: 'active',
    };

    this.validateMedicationInput(createInput);

    const [resident, medicationCatalogItem] = await Promise.all([
      this.residentsService.getResidentEntityById(
        createInput.residentId,
        organizationId,
      ),
      this.getRequiredMedicationCatalogItem(createInput.medicationCatalogId),
    ]);
    const medication = createMedicationFromInput(
      createInput,
      medicationCatalogItem.medicationName,
      resident.organizationId,
      resident.facilityId,
      actor,
    );
    const createdMedication = await this.medicationRepository.create(medication);

    return toMedicationOverview(
      createdMedication,
      `${resident.firstName} ${resident.lastName}`.trim(),
    );
  }

  async updateMedication(
    id: string,
    input: MedicationUpdateInput,
    actor: string,
    organizationId: MedicationOrder['organizationId'],
  ): Promise<MedicationDetail> {
    const currentMedication = await this.medicationRepository.findById(
      id,
      organizationId,
    );

    if (!currentMedication) {
      throw new NotFoundException('No encontre la medicacion solicitada.');
    }

    this.validateMedicationInput(input);

    const [resident, medicationCatalogItem] = await Promise.all([
      this.residentsService.getResidentEntityById(input.residentId, organizationId),
      this.getRequiredMedicationCatalogItem(input.medicationCatalogId),
    ]);
    const updatedMedication = updateMedicationFromInput(
      currentMedication,
      input,
      medicationCatalogItem.medicationName,
      resident.organizationId,
      resident.facilityId,
      actor,
    );
    const persistedMedication = await this.medicationRepository.update(
      updatedMedication,
    );

    return toMedicationDetail(
      persistedMedication,
      `${resident.firstName} ${resident.lastName}`.trim(),
    );
  }

  private async getRequiredMedicationCatalogItem(
    medicationCatalogId: string,
  ): Promise<MedicationCatalogItem> {
    const medicationCatalogItem =
      await this.medicationCatalogRepository.findById(medicationCatalogId);

    if (!medicationCatalogItem || medicationCatalogItem.status !== 'active') {
      throw new BadRequestException(
        'Selecciona un medicamento valido del catalogo.',
      );
    }

    return medicationCatalogItem;
  }

  private validateMedicationInput(
    input: MedicationCreateInput | MedicationUpdateInput,
  ): void {
    // This validation only protects the prescription contract.
    // Per-dose execution belongs to a future MedicationExecution flow.
    if (!input.medicationCatalogId.trim()) {
      throw new BadRequestException(
        'Selecciona un medicamento del catalogo.',
      );
    }

    if (!input.dose.trim()) {
      throw new BadRequestException('La dosis es obligatoria.');
    }

    if (!input.prescribedBy.trim()) {
      throw new BadRequestException('Debes indicar quien prescribio la orden.');
    }

    const scheduleTimes = input.scheduleTimes
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    if (scheduleTimes.length > 4) {
      throw new BadRequestException(
        'Puedes cargar hasta 4 horarios por medicamento.',
      );
    }

    const uniqueScheduleTimes = new Set(scheduleTimes);

    if (uniqueScheduleTimes.size !== scheduleTimes.length) {
      throw new BadRequestException(
        'Los horarios de medicacion no pueden repetirse.',
      );
    }

    const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

    for (const scheduleTime of scheduleTimes) {
      if (!timePattern.test(scheduleTime)) {
        throw new BadRequestException(
          'Cada horario debe respetar el formato HH:MM.',
        );
      }
    }

    if (input.frequency !== 'as-needed' && scheduleTimes.length === 0) {
      throw new BadRequestException(
        'Debes cargar al menos un horario para esta frecuencia.',
      );
    }

    if (input.endDate) {
      const startDay = new Date(input.startDate).toISOString().slice(0, 10);
      const endDay = new Date(input.endDate).toISOString().slice(0, 10);

      if (endDay < startDay) {
        throw new BadRequestException(
          'La fecha de fin no puede ser anterior a la fecha de inicio.',
        );
      }
    }
  }
}
