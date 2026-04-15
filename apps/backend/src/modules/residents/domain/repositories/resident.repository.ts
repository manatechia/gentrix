import type { Resident } from '@gentrix/domain-residents';
import type {
  IsoDateString,
  ResidentCareStatus,
  ResidentEvent,
  ResidentEventCreateInput,
  ResidentObservation,
  ResidentObservationCreateInput,
  ResidentObservationEntryCreateInput,
  ResidentObservationResolveInput,
} from '@gentrix/shared-types';

export interface ResidentEventRecordInput extends ResidentEventCreateInput {
  residentId: Resident['id'];
  organizationId: Resident['organizationId'];
  facilityId?: Resident['facilityId'];
  actor: string;
  createdAt: IsoDateString;
}

export interface ResidentObservationRecordInput
  extends ResidentObservationCreateInput {
  residentId: Resident['id'];
  organizationId: Resident['organizationId'];
  actor: string;
  openedAt: IsoDateString;
}

export interface ResidentObservationEntryRecordInput
  extends ResidentObservationEntryCreateInput {
  observationId: ResidentObservation['id'];
  residentId: Resident['id'];
  organizationId: Resident['organizationId'];
  actor: string;
  occurredAt: IsoDateString;
}

export interface ResidentObservationResolveRecordInput
  extends ResidentObservationResolveInput {
  observationId: ResidentObservation['id'];
  residentId: Resident['id'];
  organizationId: Resident['organizationId'];
  actor: string;
  resolvedAt: IsoDateString;
}

export interface ResidentCareStatusUpdateRecordInput {
  residentId: Resident['id'];
  organizationId: Resident['organizationId'];
  toStatus: ResidentCareStatus;
  actor: string;
  changedAt: IsoDateString;
}

export interface ResidentRepository {
  list(organizationId?: string): Promise<Resident[]>;
  findById(id: string, organizationId?: string): Promise<Resident | null>;
  create(resident: Resident): Promise<Resident>;
  update(resident: Resident): Promise<Resident>;
  touchAudit(
    residentId: Resident['id'],
    actor: string,
    organizationId?: Resident['organizationId'],
  ): Promise<void>;
  listEvents(
    organizationId?: Resident['organizationId'],
  ): Promise<ResidentEvent[]>;
  listEventsByResidentId(
    residentId: Resident['id'],
    organizationId?: Resident['organizationId'],
  ): Promise<ResidentEvent[]>;
  createEvent(event: ResidentEventRecordInput): Promise<ResidentEvent>;
  listObservations(
    organizationId?: Resident['organizationId'],
  ): Promise<ResidentObservation[]>;
  listObservationsByResidentId(
    residentId: Resident['id'],
    organizationId?: Resident['organizationId'],
  ): Promise<ResidentObservation[]>;
  findObservationById(
    observationId: ResidentObservation['id'],
    residentId: Resident['id'],
    organizationId?: Resident['organizationId'],
  ): Promise<ResidentObservation | null>;
  createObservation(
    observation: ResidentObservationRecordInput,
  ): Promise<ResidentObservation>;
  createObservationEntry(
    entry: ResidentObservationEntryRecordInput,
  ): Promise<ResidentObservation>;
  resolveObservation(
    resolution: ResidentObservationResolveRecordInput,
  ): Promise<ResidentObservation>;
  /**
   * Cambia el estado clínico operativo del residente y actualiza su
   * auditoría (`updatedAt`/`updatedBy`) en la misma operación. Devuelve el
   * residente persistido. La validación de transición es responsabilidad de
   * la capa servicio (`care-status.policy`); el repo confía en el input.
   */
  setCareStatus(input: ResidentCareStatusUpdateRecordInput): Promise<Resident>;
}

export const RESIDENT_REPOSITORY = Symbol('RESIDENT_REPOSITORY');
