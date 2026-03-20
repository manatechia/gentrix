import type { Resident } from '@gentrix/domain-residents';

export interface ResidentRepository {
  list(): Promise<Resident[]>;
  findById(id: string): Promise<Resident | null>;
  create(resident: Resident): Promise<Resident>;
}

export const RESIDENT_REPOSITORY = Symbol('RESIDENT_REPOSITORY');
