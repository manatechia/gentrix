import type { DashboardAlert } from '@gentrix/shared-types';

import {
  formatDashboardAlertSeverity,
  formatDashboardAlertSource,
} from '../../../shared/lib/display-labels';
import { surfaceCardClassName } from '../../../shared/ui/class-names';

interface AlertsPanelProps {
  alerts: DashboardAlert[];
}

const alertTimestampFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const severityBadgeClassNames: Record<DashboardAlert['severity'], string> = {
  info: 'border border-[rgba(0,102,132,0.14)] bg-white text-brand-primary',
  warning:
    'border border-[rgba(166,89,42,0.2)] bg-[rgba(255,236,214,0.76)] text-[rgb(138,72,36)]',
  critical:
    'border border-[rgba(143,38,38,0.2)] bg-[rgba(255,223,223,0.86)] text-[rgb(127,28,28)]',
};

function formatAlertTimestamp(value?: string): string | null {
  if (!value) {
    return null;
  }

  return alertTimestampFormatter.format(new Date(value));
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const countsBySeverity = alerts.reduce<
    Record<DashboardAlert['severity'], number>
  >(
    (accumulator, alert) => ({
      ...accumulator,
      [alert.severity]: accumulator[alert.severity] + 1,
    }),
    {
      info: 0,
      warning: 0,
      critical: 0,
    },
  );

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
          <p className="mt-2 max-w-[26rem] text-[0.95rem] leading-[1.55] text-brand-text-muted">
            Señales derivadas del perfil vivo, la medicación activa y las
            ejecuciones reales registradas.
          </p>
        </div>

        <div className="flex flex-wrap justify-end gap-2.5">
          {(['critical', 'warning', 'info'] as const).map((severity) => (
            <span
              key={severity}
              className={[
                'inline-flex items-center gap-2 rounded-full px-3 py-2 text-[0.76rem] font-semibold uppercase tracking-[0.14em]',
                severityBadgeClassNames[severity],
              ].join(' ')}
            >
              <span>{formatDashboardAlertSeverity(severity)}</span>
              <span>{countsBySeverity[severity]}</span>
            </span>
          ))}
        </div>
      </div>

      {alerts.length === 0 ? (
        <article className="rounded-[22px] border border-dashed border-[rgba(0,102,132,0.18)] bg-brand-neutral px-[18px] py-5 text-[0.95rem] leading-[1.6] text-brand-text-muted">
          No hay alertas derivadas para este turno con la información
          disponible.
        </article>
      ) : (
        <div className="grid gap-3">
          {alerts.map((alert) => {
            const timestamp = formatAlertTimestamp(alert.occurredAt);

            return (
              <article
                key={alert.id}
                className="rounded-[22px] border border-[rgba(0,102,132,0.08)] bg-brand-neutral px-[18px] py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={[
                          'inline-flex items-center rounded-full px-2.5 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.12em]',
                          severityBadgeClassNames[alert.severity],
                        ].join(' ')}
                      >
                        {formatDashboardAlertSeverity(alert.severity)}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-[rgba(0,102,132,0.12)] bg-white px-2.5 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-brand-text-muted">
                        {formatDashboardAlertSource(alert.source)}
                      </span>
                    </div>

                    <h3 className="mt-3 text-[1rem] font-semibold tracking-[-0.03em] text-brand-text">
                      {alert.title}
                    </h3>
                    <p className="mt-2 text-[0.95rem] leading-[1.6] text-brand-text">
                      {alert.message}
                    </p>
                  </div>

                  {timestamp ? (
                    <span className="text-[0.78rem] font-medium uppercase tracking-[0.12em] text-brand-text-muted">
                      {timestamp}
                    </span>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </article>
  );
}
