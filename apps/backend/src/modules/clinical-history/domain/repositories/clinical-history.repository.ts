import type {
  ClinicalHistoryEvent,
  ClinicalHistoryEventCreateInput,
  EntityId,
} from '@gentrix/shared-types';

export interface ClinicalHistoryRepository {
  listByResidentId(residentId: EntityId): Promise<ClinicalHistoryEvent[]>;
  create(
    residentId: EntityId,
    input: ClinicalHistoryEventCreateInput,
    actor: string,
  ): Promise<ClinicalHistoryEvent>;
}

export const CLINICAL_HISTORY_REPOSITORY = Symbol(
  'CLINICAL_HISTORY_REPOSITORY',
);
