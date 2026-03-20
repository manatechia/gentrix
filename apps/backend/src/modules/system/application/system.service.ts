import { Inject, Injectable } from '@nestjs/common';

import type {
  DashboardSnapshot,
  HealthCheck,
  ServiceIndex,
} from '@gentrix/shared-types';
import { toIsoDateString } from '@gentrix/shared-utils';

import { dashboardAlerts } from '../../../common/persistence/in-memory-seed';
import { MedicationService } from '../../medication/application/medication.service';
import { ResidentsService } from '../../residents/application/residents.service';
import { StaffService } from '../../staff/application/staff.service';

const FACILITY_CAPACITY = 24;

@Injectable()
export class SystemService {
  constructor(
    @Inject(ResidentsService)
    private readonly residentsService: ResidentsService,
    @Inject(StaffService)
    private readonly staffService: StaffService,
    @Inject(MedicationService)
    private readonly medicationService: MedicationService,
  ) {}

  getServiceIndex(): ServiceIndex {
    return {
      service: 'gentrix-backend',
      version: '1.0.0',
      frontend: 'http://localhost:4200',
      endpoints: [
        '/api/health',
        '/api/dashboard',
        '/api/residents',
        '/api/staff',
        '/api/medications',
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

  async getDashboardSnapshot(): Promise<DashboardSnapshot> {
    const [residents, staff, medications] = await Promise.all([
      this.residentsService.getResidents(),
      this.staffService.getStaff(),
      this.medicationService.getMedications(),
    ]);

    return {
      summary: {
        residentCount: residents.length,
        staffOnDuty: staff.length,
        activeMedicationCount: medications.filter((order) => order.active).length,
        occupancyRate: Math.round((residents.length / FACILITY_CAPACITY) * 100),
        memoryCareResidents: residents.filter(
          (resident) => resident.careLevel === 'memory-care',
        ).length,
      },
      residents,
      staff,
      medications,
      alerts: dashboardAlerts,
    };
  }
}
