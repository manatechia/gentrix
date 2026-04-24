import type {
  HourSettlement,
  MembershipHourlyRate,
  TeamMemberOverview,
} from '@gentrix/shared-types';

import {
  badgeBaseClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  surfaceCardClassName,
} from '../../../shared/ui/class-names';
import { isoToAr } from '../lib/date-format';

interface StaffSettlementDetailProps {
  member: TeamMemberOverview;
  currentRate: MembershipHourlyRate | null;
  settlements: HourSettlement[];
  onNewSettlement: () => void;
  onOpenSettlement: (settlementId: string) => void;
  onMarkPaidShortcut: (settlementId: string) => void;
  onOpenRateDrawer: () => void;
}

function smallButtonClassName(): string {
  return 'inline-flex min-h-9 items-center justify-center rounded-xl border border-[rgba(47,79,79,0.16)] bg-white px-3 text-[0.85rem] font-semibold text-brand-secondary transition hover:-translate-y-px disabled:opacity-60';
}

export function StaffSettlementDetail({
  member,
  currentRate,
  settlements,
  onNewSettlement,
  onOpenSettlement,
  onMarkPaidShortcut,
  onOpenRateDrawer,
}: StaffSettlementDetailProps) {
  const hasRate = currentRate !== null;

  return (
    <div className="grid gap-4">
      <article className={surfaceCardClassName}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-1">
            <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
              Detalle de persona
            </span>
            <h2 className="text-[1.35rem] font-bold tracking-[-0.04em] text-brand-text">
              {member.fullName}
            </h2>
            <span className="text-brand-text-secondary">{member.email}</span>
            <div className="mt-1 flex flex-wrap gap-2">
              <span
                className={`${badgeBaseClassName} bg-[rgba(168,108,17,0.12)] text-[rgb(130,77,25)]`}
              >
                Externo
              </span>
              {member.jobTitleLabel && (
                <span
                  className={`${badgeBaseClassName} bg-brand-secondary/12 text-brand-secondary`}
                >
                  {member.jobTitleLabel}
                </span>
              )}
            </div>
          </div>

          {hasRate && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                data-testid="worked-hours-new-settlement-button"
                className={primaryButtonClassName}
                onClick={onNewSettlement}
              >
                + Nueva liquidación
              </button>
            </div>
          )}
        </div>

        <div className="mt-5">
          {hasRate ? (
            <RateSummary
              rate={currentRate}
              onEdit={onOpenRateDrawer}
            />
          ) : (
            <NoRateBanner onCreate={onOpenRateDrawer} />
          )}
        </div>
      </article>

      <article className={surfaceCardClassName}>
        <div className="mb-4">
          <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
            Liquidaciones emitidas
          </span>
          <h3 className="mt-1 text-[1.1rem] font-bold tracking-[-0.04em] text-brand-text">
            {settlements.length === 0
              ? 'Sin liquidaciones emitidas'
              : settlements.length === 1
                ? '1 liquidación'
                : `${settlements.length} liquidaciones`}
          </h3>
        </div>

        {settlements.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-[rgba(0,102,132,0.18)] bg-brand-neutral px-4 py-6 text-center text-brand-text-secondary">
            {hasRate
              ? 'Todavía no generaste liquidaciones para esta persona.'
              : 'Cargá una tarifa para poder generar liquidaciones.'}
          </div>
        ) : (
          <SettlementsTable
            settlements={settlements}
            onOpen={onOpenSettlement}
            onMarkPaid={onMarkPaidShortcut}
          />
        )}
      </article>
    </div>
  );
}

function RateSummary({
  rate,
  onEdit,
}: {
  rate: MembershipHourlyRate;
  onEdit: () => void;
}) {
  return (
    <div
      data-testid="worked-hours-rate-summary"
      className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-[rgba(0,102,132,0.1)] bg-brand-neutral px-4 py-3"
    >
      <div className="grid gap-0.5">
        <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
          Tarifa vigente
        </span>
        <strong className="text-[1.1rem] text-brand-text">
          {rate.currency} {rate.rate} / hora
        </strong>
        <span className="text-[0.85rem] text-brand-text-muted">
          Desde {isoToAr(rate.effectiveFrom)}
        </span>
      </div>
      <button
        type="button"
        data-testid="worked-hours-edit-rate-button"
        className={smallButtonClassName()}
        onClick={onEdit}
      >
        Editar tarifa
      </button>
    </div>
  );
}

function NoRateBanner({ onCreate }: { onCreate: () => void }) {
  return (
    <div
      data-testid="worked-hours-no-rate-banner"
      className="grid gap-3 rounded-[20px] border border-dashed border-[rgba(168,108,17,0.32)] bg-[rgba(168,108,17,0.06)] px-5 py-5"
    >
      <div className="grid gap-1">
        <strong className="text-brand-text">Sin tarifa vigente</strong>
        <span className="text-brand-text-secondary">
          Para cargar horas y generar liquidaciones, primero tenés que definir
          una tarifa para esta persona.
        </span>
      </div>
      <div className="flex flex-wrap">
        <button
          type="button"
          data-testid="worked-hours-create-rate-button"
          className={primaryButtonClassName}
          onClick={onCreate}
        >
          Crear tarifa
        </button>
      </div>
    </div>
  );
}

function SettlementsTable({
  settlements,
  onOpen,
  onMarkPaid,
}: {
  settlements: HourSettlement[];
  onOpen: (id: string) => void;
  onMarkPaid: (id: string) => void;
}) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-[18px] border border-[rgba(0,102,132,0.08)] md:block">
        <table className="w-full border-collapse text-left">
          <thead className="bg-brand-neutral/80">
            <tr className="text-[0.76rem] font-semibold uppercase tracking-[0.14em] text-brand-text-muted">
              <th className="px-4 py-3">Período</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Pago</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {settlements.map((settlement) => (
              <SettlementRow
                key={settlement.id}
                settlement={settlement}
                onOpen={onOpen}
                onMarkPaid={onMarkPaid}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {settlements.map((settlement) => (
          <SettlementMobileCard
            key={settlement.id}
            settlement={settlement}
            onOpen={onOpen}
            onMarkPaid={onMarkPaid}
          />
        ))}
      </div>
    </>
  );
}

function settlementStateBadge(settlement: HourSettlement): {
  stateLabel: string;
  stateClass: string;
  paymentLabel: string;
  paymentClass: string;
} {
  if (settlement.status === 'cancelled') {
    return {
      stateLabel: 'Cancelada',
      stateClass: 'bg-[rgba(168,43,17,0.1)] text-[rgb(130,44,25)]',
      paymentLabel: '—',
      paymentClass: 'bg-brand-neutral text-brand-text-muted',
    };
  }
  const isPaid = settlement.status === 'paid';
  return {
    stateLabel: 'Liquidada',
    stateClass: 'bg-brand-primary/12 text-brand-primary',
    paymentLabel: isPaid ? 'Pagada' : 'Pendiente',
    paymentClass: isPaid
      ? 'bg-[rgba(20,108,56,0.12)] text-[rgb(20,108,56)]'
      : 'bg-[rgba(168,108,17,0.12)] text-[rgb(130,77,25)]',
  };
}

function SettlementRow({
  settlement,
  onOpen,
  onMarkPaid,
}: {
  settlement: HourSettlement;
  onOpen: (id: string) => void;
  onMarkPaid: (id: string) => void;
}) {
  const { stateLabel, stateClass, paymentLabel, paymentClass } =
    settlementStateBadge(settlement);
  const canMarkPaid = settlement.status === 'issued';

  return (
    <tr
      data-testid={`worked-hours-settlement-row-${settlement.id}`}
      className="border-t border-[rgba(0,102,132,0.06)] align-top hover:bg-brand-neutral/40"
    >
      <td className="px-4 py-3">
        <div className="grid gap-0.5">
          <strong className="text-brand-text">
            {isoToAr(settlement.periodStart)} → {isoToAr(settlement.periodEnd)}
          </strong>
          <span className="text-[0.85rem] text-brand-text-muted">
            Emitida {isoToAr(settlement.issuedAt)}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`${badgeBaseClassName} ${stateClass}`}>
          {stateLabel}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="grid gap-1">
          <span className={`${badgeBaseClassName} ${paymentClass}`}>
            {paymentLabel}
          </span>
          {settlement.status === 'paid' && settlement.paidAt && (
            <span className="text-[0.82rem] text-brand-text-muted">
              {isoToAr(settlement.paidAt)}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center rounded-xl border border-[rgba(47,79,79,0.16)] bg-white px-3 text-[0.85rem] font-semibold text-brand-secondary transition hover:-translate-y-px"
            onClick={() => onOpen(settlement.id)}
          >
            Ver
          </button>
          {canMarkPaid && (
            <button
              type="button"
              className="inline-flex min-h-9 items-center justify-center rounded-xl bg-brand-primary px-3 text-[0.85rem] font-semibold text-white shadow-brand transition hover:-translate-y-px"
              onClick={() => onMarkPaid(settlement.id)}
            >
              Marcar pagada
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function SettlementMobileCard({
  settlement,
  onOpen,
  onMarkPaid,
}: {
  settlement: HourSettlement;
  onOpen: (id: string) => void;
  onMarkPaid: (id: string) => void;
}) {
  const { stateLabel, stateClass, paymentLabel, paymentClass } =
    settlementStateBadge(settlement);
  const canMarkPaid = settlement.status === 'issued';

  return (
    <article className="grid gap-2 rounded-[18px] border border-[rgba(0,102,132,0.08)] bg-brand-neutral px-4 py-3">
      <strong className="text-brand-text">
        {isoToAr(settlement.periodStart)} → {isoToAr(settlement.periodEnd)}
      </strong>
      <span className="text-[0.85rem] text-brand-text-muted">
        Emitida {isoToAr(settlement.issuedAt)}
      </span>
      <div className="flex flex-wrap gap-2">
        <span className={`${badgeBaseClassName} ${stateClass}`}>
          {stateLabel}
        </span>
        <span className={`${badgeBaseClassName} ${paymentClass}`}>
          {paymentLabel}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex min-h-9 items-center justify-center rounded-xl border border-[rgba(47,79,79,0.16)] bg-white px-3 text-[0.85rem] font-semibold text-brand-secondary transition"
          onClick={() => onOpen(settlement.id)}
        >
          Ver
        </button>
        {canMarkPaid && (
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={() => onMarkPaid(settlement.id)}
          >
            Marcar pagada
          </button>
        )}
      </div>
    </article>
  );
}
