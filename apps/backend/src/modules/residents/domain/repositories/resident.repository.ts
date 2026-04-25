import type { Resident } from '@gentrix/domain-residents';
import type {
  IsoDateString,
  ResidentCareStatus,
  ResidentCareStatusChangeEvent,
  ResidentCareStatusClosureReason,
} from '@gentrix/shared-types';

export interface ResidentCareStatusUpdateRecordInput {
  residentId: Resident['id'];
  organizationId: Resident['organizationId'];
  fromStatus: ResidentCareStatus;
  toStatus: ResidentCareStatus;
  actor: string;
  changedAt: IsoDateString;
  /**
   * Motivo del cierre formal cuando la transición es
   * `en_observacion -> normal`. El servicio se asegura de pasarlo solo en
   * ese caso (la política lo exige); el repo lo persiste tal cual.
   */
  closureReason?: ResidentCareStatusClosureReason;
  note?: string;
}

export interface ResidentCareStatusChangeResult {
  resident: Resident;
  /**
   * Evento creado en `ResidentCareStatusChange` dentro de la misma
   * transacción que el UPDATE del residente. Permite a la capa
   * presentación devolverlo en la respuesta sin re-fetch.
   */
  changeEvent: ResidentCareStatusChangeEvent;
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
   * Cambia el estado clínico operativo del residente y deja un evento
   * auditable en `ResidentCareStatusChange` dentro de la misma transacción.
   * Refresca también `updatedAt`/`updatedBy` del residente. La validación
   * de transición y motivo de cierre las hace la capa servicio
   * (`care-status.policy`); el repo confía en el input.
   */
  setCareStatus(
    input: ResidentCareStatusUpdateRecordInput,
  ): Promise<ResidentCareStatusChangeResult>;
  /**
   * Lista los eventos de transición de `careStatus` para un residente,
   * ordenados por `createdAt` ascendente (timeline). El acceso por
   * organización se aplica si se pasa `organizationId`.
   */
  listCareStatusChangesByResident(
    residentId: Resident['id'],
    organizationId?: Resident['organizationId'],
  ): Promise<ResidentCareStatusChangeEvent[]>;
}

export const RESIDENT_REPOSITORY = Symbol('RESIDENT_REPOSITORY');
