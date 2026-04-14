import { Inject, Injectable } from '@nestjs/common';

import type {
  AuthOrganization,
  DashboardSnapshot,
  HealthCheck,
  HandoffSnapshot,
  ServiceIndex,
} from '@gentrix/shared-types';
import { toIsoDateString } from '@gentrix/shared-utils';

import { MedicationService } from '../../medication/application/medication.service';
import {
  MEDICATION_EXECUTION_REPOSITORY,
  type MedicationExecutionRepository,
} from '../../medication/domain/repositories/medication-execution.repository';
import { ResidentsService } from '../../residents/application/residents.service';
import {
  RESIDENT_REPOSITORY,
  type ResidentRepository,
} from '../../residents/domain/repositories/resident.repository';
import { StaffService } from '../../staff/application/staff.service';
import { deriveDashboardAlerts } from './dashboard-alerts';
import { deriveHandoffSnapshot } from './handoff-snapshot';

const FACILITY_CAPACITY = 24;

@Injectable()
export class SystemService {
  constructor(
    @Inject(ResidentsService)
    private readonly residentsService: ResidentsService,
    @Inject(RESIDENT_REPOSITORY)
    private readonly residentRepository: ResidentRepository,
    @Inject(StaffService)
    private readonly staffService: StaffService,
    @Inject(MedicationService)
    private readonly medicationService: MedicationService,
    @Inject(MEDICATION_EXECUTION_REPOSITORY)
    private readonly medicationExecutionRepository: MedicationExecutionRepository,
  ) {}

  getServiceIndex(): ServiceIndex {
    return {
      service: 'gentrix-backend',
      version: '1.0.0',
      frontend: 'http://localhost:4200',
      endpoints: [
        '/api/health',
        '/api/dashboard',
        '/api/handoff',
        '/api/residents',
        '/api/staff',
        '/api/medications',
        '/api/medications/catalog',
      ],
      authEndpoints: [
        '/api/auth/login',
        '/api/auth/session',
        '/api/auth/logout',
      ],
    };
  }

  async getHealthCheck(): Promise<HealthCheck> {
    const [residents, staff] = await Promise.all([
      this.residentsService.getResidents(),
      this.staffService.getStaff(),
    ]);

    return {
      status: 'ok',
      service: 'gentrix-backend',
      residents: residents.length,
      staff: staff.length,
      generatedAt: toIsoDateString(new Date()),
    };
  }

  async getDashboardSnapshot(
    organizationId?: AuthOrganization['id'],
  ): Promise<DashboardSnapshot> {
    const {
      residents,
      staff,
      medications,
      residentEvents,
      residentObservations,
      medicationExecutions,
    } = await this.getOperationalContext(organizationId);

    return {
      summary: {
        residentCount: residents.length,
        staffOnDuty: staff.length,
        activeMedicationCount: medications.filter((order) => order.active)
          .length,
        occupancyRate: Math.round((residents.length / FACILITY_CAPACITY) * 100),
        memoryCareResidents: residents.filter(
          (resident) => resident.careLevel === 'memory-care',
        ).length,
      },
      residents,
      staff,
      medications,
      alerts: deriveDashboardAlerts({
        residents,
        medications,
        residentEvents,
        medicationExecutions,
      }),
    };
  }

  async getHandoffSnapshot(
    organizationId?: AuthOrganization['id'],
  ): Promise<HandoffSnapshot> {
    const {
      residents,
      medications,
      residentEvents,
      residentObservations,
      medicationExecutions,
    } =
      await this.getOperationalContext(organizationId);

    return deriveHandoffSnapshot({
      residents,
      medications,
      residentEvents,
      residentObservations,
      medicationExecutions,
    });
  }

  private async getOperationalContext(organizationId?: AuthOrganization['id']) {
    const [
      residents,
      staff,
      medications,
      residentEvents,
      residentObservations,
      medicationExecutions,
    ] = await Promise.all([
      this.residentsService.getResidents(organizationId),
      this.staffService.getStaff(organizationId),
      this.medicationService.getMedications(organizationId),
      this.residentRepository.listEvents(organizationId),
      this.residentRepository.listObservations(organizationId),
      this.medicationExecutionRepository.list(organizationId),
    ]);

    return {
      residents,
      staff,
      medications,
      residentEvents,
      residentObservations,
      medicationExecutions,
    };
  }
}
