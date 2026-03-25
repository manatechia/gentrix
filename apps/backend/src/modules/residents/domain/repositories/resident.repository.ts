import type { Resident } from '@gentrix/domain-residents';

export interface ResidentRepository {
  list(organizationId?: string): Promise<Resident[]>;
  findById(id: string, organizationId?: string): Promise<Resident | null>;
  create(resident: Resident): Promise<Resident>;
  update(resident: Resident): Promise<Resident>;
}

export const RESIDENT_REPOSITORY = Symbol('RESIDENT_REPOSITORY');
