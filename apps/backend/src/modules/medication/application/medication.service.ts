import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import {
  computeResidentShiftDoses,
  createMedicationFromInput,
  createMedicationExecutionFromInput,
  isMedicationActive,
  toMedicationDetail,
  toMedicationExecutionOverview,
  toMedicationOverview,
  updateMedicationFromInput,
  type MedicationOrder,
} from '@gentrix/domain-medication';
import type {
  MedicationCatalogItem,
  MedicationCreateInput,
  MedicationExecutionCreateInput,
  MedicationExecutionOverview,
  MedicationDetail,
  MedicationOverview,
  MedicationUpdateInput,
  ResidentShiftDoses,
} from '@gentrix/shared-types';
import { toIsoDateString } from '@gentrix/shared-utils';

import { ResidentsService } from '../../residents/application/residents.service';
import {
  MEDICATION_CATALOG_REPOSITORY,
  type MedicationCatalogRepository,
} from '../domain/repositories/medication-catalog.repository';
import {
  MEDICATION_EXECUTION_REPOSITORY,
  type MedicationExecutionRepository,
} from '../domain/repositories/medication-execution.repository';
import {
  MEDICATION_REPOSITORY,
  type MedicationRepository,
} from '../domain/repositories/medication.repository';

/**
 * MedicationService manages current prescription orders only.
 * Concrete dose execution is recorded through the dedicated MedicationExecution
 * model linked to MedicationOrder instead of mutating the order itself.
 */
@Injectable()
export class MedicationService {
  constructor(
    @Inject(MEDICATION_REPOSITORY)
    private readonly medicationRepository: MedicationRepository,
    @Inject(MEDICATION_EXECUTION_REPOSITORY)
    private readonly medicationExecutionRepository: MedicationExecutionRepository,
    @Inject(MEDICATION_CATALOG_REPOSITORY)
    private readonly medicationCatalogRepository: MedicationCatalogRepository,
    @Inject(ResidentsService)
    private readonly residentsService: ResidentsService,
    @InjectPinoLogger(MedicationService.name)
    private readonly logger: PinoLogger,
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
    organizationId?: MedicationOrder['organizationId'],
  ): Promise<MedicationDetail> {
    const medication = await this.getRequiredMedicationOrder(id, organizationId);
    const resident = await this.residentsService.getResidentById(
      medication.residentId,
      organizationId,
    );

    return toMedicationDetail(medication, resident.fullName);
  }

  async getMedicationEntities(organizationId?: string): Promise<MedicationOrder[]> {
    return this.medicationRepository.list(organizationId);
  }

  async getMedicationExecutionsByMedicationId(
    medicationId: string,
    organizationId?: MedicationOrder['organizationId'],
  ): Promise<MedicationExecutionOverview[]> {
    const medication = await this.getRequiredMedicationOrder(
      medicationId,
      organizationId,
    );
    const resident = await this.residentsService.getResidentById(
      medication.residentId,
      organizationId,
    );
    const executions =
      await this.medicationExecutionRepository.listByMedicationOrderId(
        medication.id,
        medication.organizationId,
      );

    return executions.map((execution) =>
      toMedicationExecutionOverview(execution, resident.fullName),
    );
  }

  async getMedicationExecutionsByResidentId(
    residentId: string,
    organizationId?: MedicationOrder['organizationId'],
  ): Promise<MedicationExecutionOverview[]> {
    const resident = await this.residentsService.getResidentById(
      residentId,
      organizationId,
    );
    const executions = await this.medicationExecutionRepository.listByResidentId(
      resident.id,
      organizationId,
    );

    return executions.map((execution) =>
      toMedicationExecutionOverview(execution, resident.fullName),
    );
  }

  /**
   * Dosis del turno actual para un residente, con el estado concreto de cada
   * una (pending / administered / omitted / rejected). Usada por el panel de
   * registro por turno en la ficha del residente.
   */
  async getResidentShiftDoses(
    residentId: string,
    organizationId?: MedicationOrder['organizationId'],
  ): Promise<ResidentShiftDoses> {
    const resident = await this.residentsService.getResidentEntityById(
      residentId,
      organizationId,
    );
    const [medications, executions] = await Promise.all([
      this.medicationRepository.listByResidentId(
        resident.id,
        resident.organizationId,
      ),
      this.medicationExecutionRepository.listByResidentId(
        resident.id,
        resident.organizationId,
      ),
    ]);

    return computeResidentShiftDoses({
      medications,
      executions,
    });
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
    await this.residentsService.touchResidentAudit(
      resident.id,
      actor,
      resident.organizationId,
    );

    this.logger.info(
      {
        medicationId: createdMedication.id,
        residentId: resident.id,
        catalogId: createInput.medicationCatalogId,
        organizationId: resident.organizationId,
        actor,
      },
      'medication.order.created',
    );

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
    const currentMedication = await this.getRequiredMedicationOrder(
      id,
      organizationId,
    );

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
    await this.residentsService.touchResidentAudit(
      resident.id,
      actor,
      resident.organizationId,
    );

    this.logger.info(
      {
        medicationId: persistedMedication.id,
        residentId: resident.id,
        organizationId: resident.organizationId,
        actor,
        status: persistedMedication.status,
      },
      'medication.order.updated',
    );

    return toMedicationDetail(
      persistedMedication,
      `${resident.firstName} ${resident.lastName}`.trim(),
    );
  }

  async createMedicationExecution(
    medicationId: string,
    input: MedicationExecutionCreateInput,
    actor: string,
    organizationId?: MedicationOrder['organizationId'],
  ): Promise<MedicationExecutionOverview> {
    const medication = await this.getRequiredMedicationOrder(
      medicationId,
      organizationId,
    );
    const resident = await this.residentsService.getResidentById(
      medication.residentId,
      organizationId,
    );

    this.validateMedicationExecutionInput(medication, input);

    const execution = createMedicationExecutionFromInput(input, medication, actor);
    const createdExecution = await this.medicationExecutionRepository.create(
      execution,
    );
    await this.residentsService.touchResidentAudit(
      medication.residentId,
      actor,
      medication.organizationId,
    );

    this.logger.info(
      {
        executionId: createdExecution.id,
        medicationId: medication.id,
        residentId: medication.residentId,
        organizationId: medication.organizationId,
        actor,
      },
      'medication.execution.recorded',
    );

    return toMedicationExecutionOverview(createdExecution, resident.fullName);
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

  private async getRequiredMedicationOrder(
    id: string,
    organizationId?: MedicationOrder['organizationId'],
  ): Promise<MedicationOrder> {
    const medication = await this.medicationRepository.findById(id, organizationId);

    if (!medication) {
      throw new NotFoundException('No encontre la medicacion solicitada.');
    }

    return medication;
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

  private validateMedicationExecutionInput(
    order: MedicationOrder,
    input: MedicationExecutionCreateInput,
  ): void {
    const occurredAt = new Date(input.occurredAt);

    if (Number.isNaN(occurredAt.getTime())) {
      throw new BadRequestException(
        'La fecha de ejecucion no tiene un formato valido.',
      );
    }

    if (occurredAt.getTime() > Date.now()) {
      throw new BadRequestException(
        'La ejecucion de medicacion no puede registrarse en el futuro.',
      );
    }

    if (order.status !== 'active' || !isMedicationActive(order, input.occurredAt)) {
      throw new BadRequestException(
        'Solo puedes registrar ejecuciones sobre ordenes activas y vigentes.',
      );
    }

    const occurredAtDay = toIsoDateString(occurredAt).slice(0, 10);
    const startDay = order.startDate.slice(0, 10);
    const endDay = order.endDate?.slice(0, 10);

    if (occurredAtDay < startDay) {
      throw new BadRequestException(
        'La ejecucion no puede ser anterior al inicio de la orden.',
      );
    }

    if (endDay && occurredAtDay > endDay) {
      throw new BadRequestException(
        'La ejecucion no puede ser posterior al fin de la orden.',
      );
    }
  }
}
