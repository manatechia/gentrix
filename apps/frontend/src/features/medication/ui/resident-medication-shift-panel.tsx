import type {
  MedicationExecutionResult,
  ResidentShiftDose,
  ResidentShiftDoses,
} from '@gentrix/shared-types';

import {
  formatMedicationRoute,
  formatShiftLabel,
} from '../../../shared/lib/display-labels';
import {
  badgeBaseClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  surfaceCardClassName,
} from '../../../shared/ui/class-names';

interface ResidentMedicationShiftPanelProps {
  snapshot: ResidentShiftDoses | null;
  isLoading: boolean;
  isSaving: boolean;
  activeMutationId: string | null;
  notice: string | null;
  noticeTone: 'success' | 'error';
  onRecord: (
    medicationOrderId: string,
    doseId: string,
    scheduledFor: string,
    result: MedicationExecutionResult,
  ) => Promise<boolean>;
}

const timeFormatter = new Intl.DateTimeFormat('es-AR', {
  hour: '2-digit',
  minute: '2-digit',
});

function formatTime(value: string): string {
  return timeFormatter.format(new Date(value));
}

const statusBadgeClassNames: Record<ResidentShiftDose['status'], string> = {
  pending:
    'border border-[rgba(0,102,132,0.14)] bg-[rgba(0,102,132,0.08)] text-brand-primary',
  administered:
    'border border-[rgba(46,161,105,0.22)] bg-[rgba(46,161,105,0.1)] text-[rgb(26,110,66)]',
  omitted:
    'border border-[rgba(166,89,42,0.2)] bg-[rgba(255,236,214,0.76)] text-[rgb(138,72,36)]',
  rejected:
    'border border-[rgba(143,38,38,0.2)] bg-[rgba(255,223,223,0.86)] text-[rgb(127,28,28)]',
};

const statusLabels: Record<ResidentShiftDose['status'], string> = {
  pending: 'Pendiente',
  administered: 'Administrada',
  omitted: 'Omitida',
  rejected: 'Rechazada',
};

export function ResidentMedicationShiftPanel({
  snapshot,
  isLoading,
  isSaving,
  activeMutationId,
  notice,
  noticeTone,
  onRecord,
}: ResidentMedicationShiftPanelProps) {
  return (
    <section
      className={`${surfaceCardClassName} grid gap-5`}
      data-testid="resident-medication-shift-panel"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1.5">
          <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
            Medicación del turno
          </span>
          <p className="max-w-[62ch] leading-[1.6] text-brand-text-secondary">
            {snapshot
              ? `Turno ${formatShiftLabel(snapshot.shift).toLowerCase()}. Registrá administración, omisión o rechazo de cada dosis.`
              : 'Cargando dosis del turno.'}
          </p>
        </div>
        {snapshot && (
          <span className={badgeBaseClassName}>
            {snapshot.doses.length === 1
              ? '1 dosis'
              : `${snapshot.doses.length} dosis`}
          </span>
        )}
      </header>

      {notice && (
        <div
          data-testid="resident-medication-shift-notice"
          className={`rounded-[18px] px-4 py-3 text-[0.92rem] leading-[1.5] ${
            noticeTone === 'error'
              ? 'border border-[rgba(168,43,17,0.16)] bg-[rgba(168,43,17,0.08)] text-[rgb(130,44,25)]'
              : 'border border-[rgba(0,102,132,0.14)] bg-[rgba(0,102,132,0.08)] text-brand-secondary'
          }`}
        >
          {notice}
        </div>
      )}

      {isLoading ? (
        <p className="rounded-[20px] border border-dashed border-[rgba(0,102,132,0.2)] bg-brand-neutral/40 px-4 py-6 text-center text-brand-text-secondary">
          Cargando…
        </p>
      ) : !snapshot || snapshot.doses.length === 0 ? (
        <p className="rounded-[20px] border border-dashed border-[rgba(0,102,132,0.2)] bg-brand-neutral/40 px-4 py-6 text-center text-brand-text-secondary">
          No hay dosis programadas en este turno.
        </p>
      ) : (
        <ul className="grid gap-3">
          {snapshot.doses.map((dose) => {
            const isBusy =
              isSaving && activeMutationId === `record:${dose.id}`;
            return (
              <li
                key={dose.id}
                data-testid={`resident-medication-shift-dose-${dose.id}`}
                className="grid gap-3 rounded-[22px] border border-[rgba(0,102,132,0.08)] bg-white/85 px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="grid gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-full bg-brand-primary/10 px-3 py-1 text-[0.74rem] font-semibold uppercase tracking-[0.14em] text-brand-primary">
                        {formatTime(dose.scheduledFor)}
                      </span>
                      <span
                        className={`${badgeBaseClassName} ${statusBadgeClassNames[dose.status]}`}
                      >
                        {statusLabels[dose.status]}
                      </span>
                    </div>
                    <strong className="text-[1.02rem] text-brand-text">
                      {dose.medicationName}
                    </strong>
                    <span className="text-[0.88rem] text-brand-text-secondary">
                      {dose.dose} · {formatMedicationRoute(dose.route)}
                    </span>
                  </div>
                </div>

                {dose.status === 'pending' ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      data-testid={`resident-medication-shift-administer-${dose.id}`}
                      className={primaryButtonClassName}
                      disabled={isSaving}
                      onClick={() => {
                        void onRecord(
                          dose.medicationOrderId,
                          dose.id,
                          dose.scheduledFor,
                          'administered',
                        );
                      }}
                    >
                      {isBusy ? 'Registrando…' : 'Administrar'}
                    </button>
                    <button
                      type="button"
                      className={secondaryButtonClassName}
                      disabled={isSaving}
                      onClick={() => {
                        void onRecord(
                          dose.medicationOrderId,
                          dose.id,
                          dose.scheduledFor,
                          'omitted',
                        );
                      }}
                    >
                      Omitir
                    </button>
                    <button
                      type="button"
                      className={secondaryButtonClassName}
                      disabled={isSaving}
                      onClick={() => {
                        void onRecord(
                          dose.medicationOrderId,
                          dose.id,
                          dose.scheduledFor,
                          'rejected',
                        );
                      }}
                    >
                      Rechazar
                    </button>
                  </div>
                ) : (
                  <span className="text-[0.88rem] text-brand-text-muted">
                    Registrada por {dose.actor ?? 'sin identificar'}
                    {dose.occurredAt ? ` a las ${formatTime(dose.occurredAt)}` : ''}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
