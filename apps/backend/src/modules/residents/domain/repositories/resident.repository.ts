import type { Resident } from '@gentrix/domain-residents';
import type {
  IsoDateString,
  ResidentCareStatus,
} from '@gentrix/shared-types';

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
  /**
   * Cambia el estado clínico operativo del residente y actualiza su
   * auditoría (`updatedAt`/`updatedBy`) en la misma operación. Devuelve el
   * residente persistido. La validación de transición es responsabilidad de
   * la capa servicio (`care-status.policy`); el repo confía en el input.
   */
  setCareStatus(input: ResidentCareStatusUpdateRecordInput): Promise<Resident>;
}

export const RESIDENT_REPOSITORY = Symbol('RESIDENT_REPOSITORY');
