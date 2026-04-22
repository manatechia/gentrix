import type { MedicationAdherenceSummary } from '@gentrix/shared-types';

import {
  badgeBaseClassName,
  surfaceCardClassName,
} from '../../../shared/ui/class-names';

interface ResidentMedicationAdherenceCardProps {
  summary: MedicationAdherenceSummary | null;
  isLoading: boolean;
  error: string | null;
}

function formatRate(rate: number | null): string {
  if (rate === null) return '—';
  return `${Math.round(rate * 100)}%`;
}

function resolveRateTone(rate: number | null): string {
  if (rate === null) return 'bg-brand-neutral text-brand-text-secondary';
  if (rate >= 0.9) {
    return 'bg-[rgba(46,161,105,0.12)] text-[rgb(26,110,66)]';
  }
  if (rate >= 0.7) {
    return 'bg-[rgba(212,140,18,0.16)] text-[rgb(150,90,10)]';
  }
  return 'bg-[rgba(168,43,17,0.08)] text-[rgb(130,44,25)]';
}

export function ResidentMedicationAdherenceCard({
  summary,
  isLoading,
  error,
}: ResidentMedicationAdherenceCardProps) {
  return (
    <section
      className={`${surfaceCardClassName} grid gap-4`}
      data-testid="resident-medication-adherence-card"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1.5">
          <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
            Adherencia a medicación
          </span>
          <p className="max-w-[62ch] leading-[1.6] text-brand-text-secondary">
            Últimos {summary?.days ?? 30} días — proporción de dosis
            administradas sobre el total registrado.
          </p>
        </div>
        {summary && (
          <span
            className={`${badgeBaseClassName} ${resolveRateTone(summary.adherenceRate)}`}
          >
            {formatRate(summary.adherenceRate)}
          </span>
        )}
      </header>

      {error ? (
        <div className="rounded-[18px] border border-[rgba(168,43,17,0.16)] bg-[rgba(168,43,17,0.08)] px-4 py-3 text-[0.92rem] leading-[1.5] text-[rgb(130,44,25)]">
          {error}
        </div>
      ) : isLoading || !summary ? (
        <p className="rounded-[20px] border border-dashed border-[rgba(0,102,132,0.2)] bg-brand-neutral/40 px-4 py-5 text-center text-brand-text-secondary">
          Calculando…
        </p>
      ) : summary.totalCount === 0 ? (
        <p className="rounded-[20px] border border-dashed border-[rgba(0,102,132,0.2)] bg-brand-neutral/40 px-4 py-5 text-brand-text-secondary">
          Sin registros de ejecución en los últimos {summary.days} días.
        </p>
      ) : (
        <div className="grid gap-3 min-[540px]:grid-cols-3">
          <Metric
            label="Administradas"
            value={summary.administeredCount}
            total={summary.totalCount}
          />
          <Metric
            label="Omitidas"
            value={summary.omittedCount}
            total={summary.totalCount}
          />
          <Metric
            label="Rechazadas"
            value={summary.rejectedCount}
            total={summary.totalCount}
          />
        </div>
      )}
    </section>
  );
}

function Metric({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const share = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <article className="rounded-[20px] bg-brand-neutral px-4 py-3.5">
      <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
        {label}
      </span>
      <strong className="mt-2 block text-[1.35rem] leading-none tracking-[-0.03em] text-brand-text">
        {value}
      </strong>
      <span className="mt-1 block text-[0.88rem] text-brand-text-secondary">
        {share}% del total
      </span>
    </article>
  );
}
