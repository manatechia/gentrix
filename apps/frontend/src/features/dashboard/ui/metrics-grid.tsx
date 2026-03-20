import type { DashboardSnapshot } from '@gentrix/shared-types';

const metrics = [
  {
    label: 'Personal',
    hint: 'equipo en turno',
    accent: 'bg-brand-primary',
  },
  {
    label: 'Medicacion',
    hint: 'medicaciones activas',
    accent: 'bg-brand-secondary',
  },
  {
    label: 'Alertas',
    hint: 'incidencias operativas del dia',
    accent: 'bg-brand-tertiary',
  },
  {
    label: 'Ocupacion',
    hint: 'ocupacion general',
    accent:
      'bg-[linear-gradient(90deg,var(--color-brand-secondary),rgba(47,79,79,0.28))]',
  },
] as const;

interface MetricsGridProps {
  dashboard: DashboardSnapshot;
}

export function MetricsGrid({ dashboard }: MetricsGridProps) {
  const values = [
    dashboard.summary.staffOnDuty,
    dashboard.summary.activeMedicationCount,
    dashboard.alerts.length,
    `${dashboard.summary.occupancyRate}%`,
  ];

  return (
    <section className="grid gap-[18px] min-[1181px]:grid-cols-4">
      {metrics.map((metric, index) => (
        <article
          key={metric.label}
          className="relative overflow-hidden rounded-[28px] border border-[rgba(0,102,132,0.08)] bg-white/92 px-[22px] pb-7 pt-[22px] shadow-panel backdrop-blur-sm"
        >
          <span className="inline-flex items-center rounded-full bg-brand-neutral px-3 py-2 text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
            {metric.label}
          </span>
          <strong className="mt-[18px] block text-[clamp(2.35rem,4vw,3.35rem)] leading-[0.98] font-bold tracking-[-0.06em] text-brand-text">
            {values[index]}
          </strong>
          <span className="mt-3 block pr-2 text-brand-text-secondary">
            {metric.hint}
          </span>
          <span
            className={[
              'absolute bottom-[18px] left-[22px] right-[22px] h-[5px] rounded-full',
              metric.accent,
            ].join(' ')}
          />
        </article>
      ))}
    </section>
  );
}
