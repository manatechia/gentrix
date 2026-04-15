import { Inject, Injectable } from '@nestjs/common';

import type {
  ClinicalHistoryEvent,
  ClinicalHistoryEventCreateInput,
  ResidentCareStatus,
} from '@gentrix/shared-types';

import { ResidentsService } from '../../residents/application/residents.service';
import {
  CLINICAL_HISTORY_REPOSITORY,
  type ClinicalHistoryRepository,
} from '../domain/repositories/clinical-history.repository';

/**
 * Resultado de crear un evento clínico. Se devuelve el evento persistido y,
 * cuando el checkbox de "poner en observación" estaba marcado, también el
 * resultado del cambio de estado para que la UI muestre el toast adecuado.
 */
export interface ClinicalHistoryEventCreateResult {
  event: ClinicalHistoryEvent;
  careStatus: {
    changed: boolean;
    fromStatus: ResidentCareStatus;
    toStatus: ResidentCareStatus;
  } | null;
}

@Injectable()
export class ClinicalHistoryService {
  constructor(
    @Inject(CLINICAL_HISTORY_REPOSITORY)
    private readonly clinicalHistoryRepository: ClinicalHistoryRepository,
    @Inject(ResidentsService)
    private readonly residentsService: ResidentsService,
  ) {}

  async listByResidentId(residentId: string): Promise<ClinicalHistoryEvent[]> {
    await this.ensureResidentExists(residentId);
    return this.clinicalHistoryRepository.listByResidentId(
      residentId as ClinicalHistoryEvent['residentId'],
    );
  }

  /**
   * Crea un evento clínico y, opcionalmente (si `putUnderObservation` está en
   * true), pone al residente en observación.
   *
   * Reglas:
   *  - El evento se persiste primero. Si el cambio de estado falla, el evento
   *    queda creado igual (no es atómico): preferimos preservar el registro
   *    clínico aunque la transición sea inválida.
   *  - Si el residente ya estaba en observación, el flag se procesa pero no
   *    genera cambio (`changed: false`).
   *  - Si `putUnderObservation` es falsy, no se toca `careStatus`.
   *  - El audit `updatedAt`/`updatedBy` del residente se refresca igual,
   *    independientemente del flag (es la convención del módulo).
   */
  async create(
    residentId: string,
    input: ClinicalHistoryEventCreateInput,
    actor: string,
  ): Promise<ClinicalHistoryEventCreateResult> {
    const resident = await this.residentsService.getResidentEntityById(residentId);
    const createdEvent = await this.clinicalHistoryRepository.create(
      residentId as ClinicalHistoryEvent['residentId'],
      input,
      actor,
    );

    let careStatusChange: ClinicalHistoryEventCreateResult['careStatus'] = null;

    if (input.putUnderObservation === true) {
      const change = await this.residentsService.setResidentCareStatus(
        resident.id,
        'en_observacion',
        actor,
        resident.organizationId,
      );

      careStatusChange = {
        changed: change.changed,
        fromStatus: change.fromStatus,
        toStatus: change.toStatus,
      };

      // Si la transición fue efectiva, el repo ya actualizó audit dentro de
      // `setCareStatus`. Si no hubo cambio (residente ya en observación)
      // refrescamos audit explícitamente para no romper la convención del
      // módulo: crear un evento siempre actualiza audit del residente.
      if (!change.changed) {
        await this.residentsService.touchResidentAudit(
          resident.id,
          actor,
          resident.organizationId,
        );
      }
    } else {
      await this.residentsService.touchResidentAudit(
        resident.id,
        actor,
        resident.organizationId,
      );
    }

    return { event: createdEvent, careStatus: careStatusChange };
  }

  private async ensureResidentExists(residentId: string): Promise<void> {
    await this.residentsService.getResidentById(residentId);
  }
}
