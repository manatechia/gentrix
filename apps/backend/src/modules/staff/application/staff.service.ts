import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { StaffMember } from '@gentrix/domain-staff';
import type { StaffOverview } from '@gentrix/shared-types';

import {
  STAFF_REPOSITORY,
  type StaffRepository,
} from '../domain/repositories/staff.repository';

function formatStaffRole(role: string): string {
  const labels: Record<string, string> = {
    nurse: 'Enfermeria',
    doctor: 'Medico',
    caregiver: 'Cuidador',
    coordinator: 'Coordinacion',
  };

  return labels[role] ?? role;
}

function formatShiftLabel(shift: string): string {
  const labels: Record<string, string> = {
    morning: 'Manana',
    afternoon: 'Tarde',
    night: 'Noche',
  };

  return labels[shift] ?? shift;
}

function formatStaffAssignment(role: string, ward: string, shift: string): string {
  return `${formatStaffRole(role)} - ${ward} - ${formatShiftLabel(shift)}`;
}

@Injectable()
export class StaffService {
  constructor(
    @Inject(STAFF_REPOSITORY)
    private readonly staffRepository: StaffRepository,
  ) {}

  async getStaff(organizationId?: string): Promise<StaffOverview[]> {
    return (await this.staffRepository.list(organizationId)).map((member) => ({
      id: member.id,
      name: `${member.firstName} ${member.lastName}`,
      role: member.role,
      ward: member.ward,
      shift: member.shift,
      assignment: formatStaffAssignment(member.role, member.ward, member.shift),
      status: member.status,
    }));
  }

  async getStaffEntities(organizationId?: string): Promise<StaffMember[]> {
    return this.staffRepository.list(organizationId);
  }

  async getStaffEntityById(
    staffId: string,
    organizationId?: string,
  ): Promise<StaffMember> {
    const member = await this.staffRepository.findById(staffId, organizationId);

    if (!member) {
      throw new NotFoundException('No encontre el personal solicitado.');
    }

    return member;
  }
}
