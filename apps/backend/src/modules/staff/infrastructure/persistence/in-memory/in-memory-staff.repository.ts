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

  async list(): Promise<StaffMember[]> {
    return this.staff.map((member) => ({
      ...member,
      audit: { ...member.audit },
    }));
  }
}
