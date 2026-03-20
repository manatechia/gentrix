import { surfaceCardClassName } from '../../../shared/ui/class-names';

interface AlertsPanelProps {
  alerts: string[];
}

const alertIcons = [
  { label: 'H', className: 'bg-brand-primary' },
  { label: 'S', className: 'bg-brand-secondary' },
  { label: 'A', className: 'bg-brand-tertiary' },
  { label: '!', className: 'bg-brand-danger' },
] as const;

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  return (
    <article className={surfaceCardClassName}>
      <div className="mb-[18px] flex items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-primary">
            Alertas
          </span>
          <h2 className="mt-1 text-[1.35rem] font-bold tracking-[-0.04em] text-brand-text">
            Alertas del turno
          </h2>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {alertIcons.map((icon) => (
            <span
              key={icon.label}
              className={[
                'grid h-[42px] w-[42px] place-items-center rounded-full text-[0.86rem] font-bold text-white',
                icon.className,
              ].join(' ')}
            >
              {icon.label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        {alerts.map((alert) => (
          <article
            key={alert}
            className="rounded-[22px] border border-[rgba(0,102,132,0.08)] bg-brand-neutral px-[18px] py-4 leading-[1.55] text-brand-text"
          >
            {alert}
          </article>
        ))}
      </div>
    </article>
  );
}
