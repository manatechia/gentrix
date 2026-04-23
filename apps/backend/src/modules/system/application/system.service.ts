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
import { UsersService } from '../../users/application/users.service';
import { deriveDashboardAlerts } from './dashboard-alerts';
import { deriveHandoffSnapshot } from './handoff-snapshot';

const FACILITY_CAPACITY = 24;

@Injectable()
export class SystemService {
  constructor(
    @Inject(ResidentsService)
    private readonly residentsService: ResidentsService,
    @Inject(UsersService)
    private readonly usersService: UsersService,
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
        '/api/users',
        '/api/users/team',
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

  async getHealthCheck(organizationId?: AuthOrganization['id']): Promise<HealthCheck> {
    // `team` sin organizationId no tiene sentido — healthcheck fuera de una
    // sesión devuelve 0 equipo, que es la respuesta honesta.
    const [residents, team] = await Promise.all([
      this.residentsService.getResidents(organizationId),
      organizationId ? this.usersService.getTeam(organizationId) : Promise.resolve([]),
    ]);

    return {
      status: 'ok',
      service: 'gentrix-backend',
      residents: residents.length,
      team: team.length,
      generatedAt: toIsoDateString(new Date()),
    };
  }

  async getDashboardSnapshot(
    organizationId?: AuthOrganization['id'],
  ): Promise<DashboardSnapshot> {
    const { residents, team, medications, medicationExecutions } =
      await this.getOperationalContext(organizationId);

    return {
      summary: {
        residentCount: residents.length,
        teamOnDuty: team.length,
        activeMedicationCount: medications.filter((order) => order.active)
          .length,
        occupancyRate: Math.round((residents.length / FACILITY_CAPACITY) * 100),
        memoryCareResidents: residents.filter(
          (resident) => resident.careLevel === 'memory-care',
        ).length,
      },
      residents,
      team,
      medications,
      alerts: deriveDashboardAlerts({
        residents,
        medications,
        medicationExecutions,
      }),
    };
  }

  async getHandoffSnapshot(
    organizationId?: AuthOrganization['id'],
  ): Promise<HandoffSnapshot> {
    const { residents, medications, medicationExecutions } =
      await this.getOperationalContext(organizationId);

    return deriveHandoffSnapshot({
      residents,
      medications,
      medicationExecutions,
    });
  }

  private async getOperationalContext(organizationId?: AuthOrganization['id']) {
    const [residents, team, medications, medicationExecutions] =
      await Promise.all([
        this.residentsService.getResidents(organizationId),
        organizationId
          ? this.usersService.getTeam(organizationId)
          : Promise.resolve([]),
        this.medicationService.getMedications(organizationId),
        this.medicationExecutionRepository.list(organizationId),
      ]);

    return {
      residents,
      team,
      medications,
      medicationExecutions,
    };
  }
}
