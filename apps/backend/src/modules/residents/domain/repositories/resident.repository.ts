import type { Resident } from '@gentrix/domain-residents';
import type {
  IsoDateString,
  ResidentEvent,
  ResidentEventCreateInput,
} from '@gentrix/shared-types';

export interface ResidentEventRecordInput extends ResidentEventCreateInput {
  residentId: Resident['id'];
  organizationId: Resident['organizationId'];
  facilityId?: Resident['facilityId'];
  actor: string;
  createdAt: IsoDateString;
}

export interface ResidentRepository {
  list(organizationId?: string): Promise<Resident[]>;
  findById(id: string, organizationId?: string): Promise<Resident | null>;
  create(resident: Resident): Promise<Resident>;
  update(resident: Resident): Promise<Resident>;
  listEvents(
    organizationId?: Resident['organizationId'],
  ): Promise<ResidentEvent[]>;
  listEventsByResidentId(
    residentId: Resident['id'],
    organizationId?: Resident['organizationId'],
  ): Promise<ResidentEvent[]>;
  createEvent(event: ResidentEventRecordInput): Promise<ResidentEvent>;
}

export const RESIDENT_REPOSITORY = Symbol('RESIDENT_REPOSITORY');
