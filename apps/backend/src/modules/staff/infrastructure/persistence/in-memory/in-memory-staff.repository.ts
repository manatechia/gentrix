import { Injectable } from '@nestjs/common';

import type { StaffMember } from '@gentrix/domain-staff';

import { seedStaff } from '../../../../../common/persistence/in-memory-seed';
import type { StaffRepository } from '../../../domain/repositories/staff.repository';

@Injectable()
export class InMemoryStaffRepository implements StaffRepository {
  private readonly staff: StaffMember[] = seedStaff.map((member) => ({
    ...member,
    audit: { ...member.audit },
  }));

  async list(organizationId?: string): Promise<StaffMember[]> {
    return this.staff
      .filter((member) =>
        organizationId ? member.organizationId === organizationId : true,
      )
      .map((member) => ({
        ...member,
        audit: { ...member.audit },
      }));
  }

  async findById(id: string): Promise<StaffMember | null> {
    const member = this.staff.find((entry) => entry.id === id);

    return member
      ? {
          ...member,
          audit: { ...member.audit },
        }
      : null;
  }
}
