import type {
  EntityId,
  HourSettlement,
  HourSettlementDetail,
} from '@gentrix/shared-types';

export interface SettlementIssueRecord {
  membershipId: EntityId;
  periodStart: Date;
  periodEnd: Date;
  notes?: string | null;
  actor: string;
}

/// Agrupa los datos necesarios para congelar tarifa por entry al momento
/// de emitir la liquidación.
export interface SettlementEntryFreeze {
  entryId: EntityId;
  appliedRate: string;
  appliedCurrency: string;
}

export interface HourSettlementRepository {
  listByMembership(membershipId: EntityId): Promise<HourSettlement[]>;
  findById(id: EntityId): Promise<HourSettlement | null>;
  findDetailById(id: EntityId): Promise<HourSettlementDetail | null>;
  findOverlappingActive(
    membershipId: EntityId,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<HourSettlement | null>;
  /// Transacción atómica: crea el settlement, asigna `settlementId` y
  /// `appliedRate` / `appliedCurrency` en cada entry del set, y vuelve a
  /// leer el detalle completo.
  issue(
    input: SettlementIssueRecord,
    frozenEntries: SettlementEntryFreeze[],
  ): Promise<HourSettlementDetail>;
  markPaid(id: EntityId, actor: string): Promise<HourSettlementDetail>;
  cancel(id: EntityId, actor: string): Promise<HourSettlementDetail>;
}

export const HOUR_SETTLEMENT_REPOSITORY = Symbol('HOUR_SETTLEMENT_REPOSITORY');
