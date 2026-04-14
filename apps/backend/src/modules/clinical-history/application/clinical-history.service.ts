import { Inject, Injectable } from '@nestjs/common';

import type {
  ClinicalHistoryEvent,
  ClinicalHistoryEventCreateInput,
} from '@gentrix/shared-types';

import { ResidentsService } from '../../residents/application/residents.service';
import {
  CLINICAL_HISTORY_REPOSITORY,
  type ClinicalHistoryRepository,
} from '../domain/repositories/clinical-history.repository';

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

  async create(
    residentId: string,
    input: ClinicalHistoryEventCreateInput,
    actor: string,
  ): Promise<ClinicalHistoryEvent> {
    const resident = await this.residentsService.getResidentEntityById(residentId);
    const createdEvent = await this.clinicalHistoryRepository.create(
      residentId as ClinicalHistoryEvent['residentId'],
      input,
      actor,
    );
    await this.residentsService.touchResidentAudit(
      resident.id,
      actor,
      resident.organizationId,
    );
    return createdEvent;
  }

  private async ensureResidentExists(residentId: string): Promise<void> {
    await this.residentsService.getResidentById(residentId);
  }
}
