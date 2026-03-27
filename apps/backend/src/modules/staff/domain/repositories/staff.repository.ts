import type { StaffMember } from '@gentrix/domain-staff';

export interface StaffRepository {
  list(organizationId?: string): Promise<StaffMember[]>;
  findById(
    id: string,
    organizationId?: string,
  ): Promise<StaffMember | null>;
}

export const STAFF_REPOSITORY = Symbol('STAFF_REPOSITORY');
