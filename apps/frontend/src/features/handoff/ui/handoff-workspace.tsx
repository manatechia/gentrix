import { Link } from 'react-router-dom';

import type { AuthSession, HandoffSnapshot } from '@gentrix/shared-types';

import {
  formatDashboardAlertSeverity,
  formatHandoffMedicationStatus,
  formatMedicationRoute,
  formatResidentCareLevel,
  formatShiftLabel,
} from '../../../shared/lib/display-labels';
import {
  badgeBaseClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  shellCardClassName,
  surfaceCardClassName,
} from '../../../shared/ui/class-names';
import { StatusNotice } from '../../dashboard/ui/status-notice';
import { WorkspaceShell } from '../../dashboard/ui/workspace-shell';
import type { DashboardScreenState } from '../../dashboard/types/dashboard-screen-state';

interface HandoffWorkspaceProps {
  screenState: DashboardScreenState;
  session: AuthSession;
  handoff: HandoffSnapshot | null;
  handoffError: string | null;
  residentCount: number;
  onLogout: () => void | Promise<void>;
  onRetry: () => void | Promise<void>;
}

const shiftDateTimeFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const shiftTimeFormatter = new Intl.DateTimeFormat('es-AR', {
  hour: '2-digit',
  minute: '2-digit',
});

const priorityBadgeClassNames: Record<
  HandoffSnapshot['residents'][number]['priority'],
  string
> = {
  info: 'border border-[rgba(0,102,132,0.14)] bg-white text-brand-primary',
  warning:
    'border border-[rgba(166,89,42,0.2)] bg-[rgba(255,236,214,0.76)] text-[rgb(138,72,36)]',
  critical:
    'border border-[rgba(143,38,38,0.2)] bg-[rgba(255,223,223,0.86)] text-[rgb(127,28,28)]',
};

const medicationIssueBadgeClassNames: Record<
  HandoffSnapshot['residents'][number]['medicationIssues'][number]['status'],
  string
> = {
  pending:
    'border border-[rgba(0,102,132,0.14)] bg-[rgba(0,102,132,0.08)] text-brand-primary',
  omitted:
    'border border-[rgba(166,89,42,0.2)] bg-[rgba(255,236,214,0.76)] text-[rgb(138,72,36)]',
  rejected:
    'border border-[rgba(143,38,38,0.2)] bg-[rgba(255,223,223,0.86)] text-[rgb(127,28,28)]',
};

function SummaryTile({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <article className="rounded-[22px] border border-[rgba(0,102,132,0.08)] bg-brand-neutral/60 px-5 py-4">
      <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
        {label}
      </span>
      <strong className="mt-2 block text-[1.8rem] leading-none tracking-[-0.05em] text-brand-text">
        {value}
      </strong>
    </article>
  );
}

function formatShiftDateTime(value: string): string {
  return shiftDateTimeFormatter.format(new Date(value));
}

function formatShiftTime(value: string): string {
  return shiftTimeFormatter.format(new Date(value));
}

export function HandoffWorkspace({
  screenState,
  session,
  handoff,
  handoffError,
  residentCount,
  onLogout,
  onRetry,
}: HandoffWorkspaceProps) {
  return (
    <WorkspaceShell
      residentCount={residentCount}
      session={session}
      onLogout={onLogout}
    >
      <section className={`${shellCardClassName} grid gap-5 px-7 py-6`}>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="grid gap-2.5">
            <span className="inline-flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-primary">
              Handoff
            </span>
            <h1 className="text-[clamp(2rem,3.2vw,2.6rem)] font-bold tracking-[-0.04em] text-brand-text">
              Pase minimo de turno
            </h1>
            <p className="max-w-[64ch] leading-[1.65] text-brand-text-secondary">
              Resume que medicacion sigue pendiente, omitida o rechazada antes
              del proximo relevo.
            </p>
          </div>

          {handoff && (
            <div className="flex flex-wrap items-center gap-3">
              <span className={primaryButtonClassName}>
                Turno {formatShiftLabel(handoff.shift).toLowerCase()}
              </span>
              <span className={secondaryButtonClassName}>
                Sigue {formatShiftLabel(handoff.nextShift).toLowerCase()}
              </span>
            </div>
          )}
        </div>
      </section>

      {screenState === 'loading' && (
        <StatusNotice message="Preparando el pase de turno con datos operativos reales." />
      )}

      {screenState === 'error' && (
        <StatusNotice
          title="No pude cargar el pase de turno."
          message={handoffError ?? 'Ocurrio un error inesperado.'}
          actions={[
            {
              label: 'Reintentar',
              onClick: onRetry,
            },
            {
              label: 'Volver al ingreso',
              onClick: onLogout,
              variant: 'secondary',
            },
          ]}
        />
      )}

      {screenState === 'ready' && handoff && (
        <>
          <section className={`${surfaceCardClassName} grid gap-5`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="grid gap-2">
                <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-primary">
                  Ventana del turno
                </span>
                <h2 className="text-[1.35rem] font-bold tracking-[-0.04em] text-brand-text">
                  {formatShiftLabel(handoff.shift)} actual
                </h2>
                <p className="leading-[1.6] text-brand-text-secondary">
                  Desde {formatShiftDateTime(handoff.shiftStartedAt)} hasta{' '}
                  {formatShiftDateTime(handoff.shiftEndsAt)}.
                </p>
              </div>

              <div className="rounded-[22px] border border-[rgba(0,102,132,0.08)] bg-brand-neutral/60 px-4 py-3">
                <span className="block text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
                  Proximo relevo
                </span>
                <strong className="mt-2 block text-[1.1rem] tracking-[-0.04em] text-brand-text">
                  {formatShiftLabel(handoff.nextShift)}
                </strong>
              </div>
            </div>

            <div className="grid gap-3 min-[860px]:grid-cols-5">
              <SummaryTile
                label="Residentes"
                value={handoff.summary.relevantResidentCount}
              />
              <SummaryTile
                label="Pendientes"
                value={handoff.summary.pendingMedicationCount}
              />
              <SummaryTile
                label="Omitidas"
                value={handoff.summary.omittedMedicationCount}
              />
              <SummaryTile
                label="Rechazadas"
                value={handoff.summary.rejectedMedicationCount}
              />
              <SummaryTile
                label="Próximo turno"
                value={handoff.summary.upcomingDoseCount}
              />
            </div>
          </section>

          {handoff.residents.length === 0 ? (
            <section className={surfaceCardClassName}>
              <div className="rounded-[22px] border border-dashed border-[rgba(0,102,132,0.2)] bg-brand-neutral/50 px-5 py-5 text-brand-text-secondary">
                No hay residentes relevantes para este pase con la informacion
                disponible en el turno actual.
              </div>
            </section>
          ) : (
            <section className="grid gap-4">
              {handoff.residents.map((resident) => (
                <article
                  key={resident.residentId}
                  className={surfaceCardClassName}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="grid gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={[
                            badgeBaseClassName,
                            priorityBadgeClassNames[resident.priority],
                          ].join(' ')}
                        >
                          {formatDashboardAlertSeverity(resident.priority)}
                        </span>
                        <span className="inline-flex min-h-8 w-fit items-center justify-center rounded-full border border-[rgba(0,102,132,0.12)] bg-white px-3 text-[0.78rem] font-semibold uppercase tracking-[0.04em] text-brand-text-muted">
                          {formatResidentCareLevel(resident.careLevel)}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-[1.2rem] font-bold tracking-[-0.04em] text-brand-text">
                          {resident.fullName}
                        </h2>
                        <p className="mt-1 leading-[1.55] text-brand-text-secondary">
                          Habitacion {resident.room}
                        </p>
                      </div>
                    </div>

                    <Link
                      className={secondaryButtonClassName}
                      to={`/residentes/${resident.residentId}`}
                    >
                      Ver residente
                    </Link>
                  </div>

                  <section className="mt-5 grid gap-3 rounded-[22px] border border-[rgba(0,102,132,0.08)] bg-brand-neutral/50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                        Medicacion del turno
                      </span>
                      <span className="text-[0.9rem] text-brand-text-secondary">
                        {resident.medicationIssues.length === 0
                          ? 'Sin novedades'
                          : `${resident.medicationIssues.length} incidencia${resident.medicationIssues.length === 1 ? '' : 's'}`}
                      </span>
                    </div>

                    {resident.medicationIssues.length === 0 ? (
                      <div className="rounded-[20px] border border-dashed border-[rgba(0,102,132,0.18)] bg-white/65 px-4 py-4 text-brand-text-secondary">
                        Sin novedades en el turno actual.
                      </div>
                    ) : (
                      <div className="grid gap-2.5">
                        {resident.medicationIssues.map((issue) => (
                          <article
                            key={issue.id}
                            className="rounded-[20px] border border-[rgba(0,102,132,0.08)] bg-white/78 px-4 py-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="grid gap-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={[
                                      badgeBaseClassName,
                                      medicationIssueBadgeClassNames[
                                        issue.status
                                      ],
                                    ].join(' ')}
                                  >
                                    {formatHandoffMedicationStatus(
                                      issue.status,
                                    )}
                                  </span>
                                  <strong className="text-brand-text">
                                    {issue.medicationName}
                                  </strong>
                                </div>
                                <span className="leading-[1.55] text-brand-text-secondary">
                                  Programada para las{' '}
                                  {formatShiftTime(issue.scheduledFor)}
                                </span>
                              </div>

                              <div className="grid gap-1 text-right text-brand-text-secondary">
                                {issue.occurredAt ? (
                                  <>
                                    <span>
                                      {formatShiftDateTime(issue.occurredAt)}
                                    </span>
                                    <strong className="text-brand-text">
                                      {issue.actor ?? 'actor no identificado'}
                                    </strong>
                                  </>
                                ) : (
                                  <span className="font-medium text-brand-text">
                                    Sin registro de ejecucion
                                  </span>
                                )}
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>

                  {resident.upcomingDoses.length > 0 && (
                    <section className="mt-4 grid gap-3 rounded-[22px] border border-[rgba(0,102,132,0.08)] bg-[rgba(0,102,132,0.04)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                          Próximo turno · {formatShiftLabel(handoff.nextShift).toLowerCase()}
                        </span>
                        <span className="text-[0.9rem] text-brand-text-secondary">
                          {resident.upcomingDoses.length === 1
                            ? '1 dosis'
                            : `${resident.upcomingDoses.length} dosis`}
                        </span>
                      </div>
                      <ul className="grid gap-2">
                        {resident.upcomingDoses.map((dose) => (
                          <li
                            key={dose.id}
                            className="flex flex-wrap items-start justify-between gap-3 rounded-[18px] bg-white/80 px-4 py-3"
                          >
                            <div className="grid gap-0.5">
                              <strong className="text-brand-text">
                                {dose.medicationName}
                              </strong>
                              <span className="text-[0.88rem] text-brand-text-secondary">
                                {dose.dose} · {formatMedicationRoute(dose.route)}
                              </span>
                            </div>
                            <span className="inline-flex rounded-full bg-brand-primary/10 px-3 py-1 text-[0.78rem] font-semibold text-brand-primary">
                              {formatShiftTime(dose.scheduledFor)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </article>
              ))}
            </section>
          )}
        </>
      )}
    </WorkspaceShell>
  );
}
