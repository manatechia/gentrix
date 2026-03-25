import type { StaffMember } from '@gentrix/domain-staff';

export interface StaffRepository {
  list(organizationId?: string): Promise<StaffMember[]>;
}

export const STAFF_REPOSITORY = Symbol('STAFF_REPOSITORY');
