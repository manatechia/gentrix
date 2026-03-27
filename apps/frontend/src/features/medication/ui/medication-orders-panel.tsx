import { Link } from 'react-router-dom';

import type {
  MedicationExecutionOverview,
  MedicationExecutionResult,
  MedicationOverview,
} from '@gentrix/shared-types';

import {
  formatEntityStatus,
  formatMedicationExecutionResult,
  formatMedicationFrequency,
  formatMedicationRoute,
} from '../../../shared/lib/display-labels';
import {
  badgeBaseClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  surfaceCardClassName,
} from '../../../shared/ui/class-names';
import { MultiSelectField } from '../../../shared/ui/multi-select-field';
import type { SelectFieldOption } from '../../../shared/ui/select-field';

interface MedicationOrdersPanelProps {
  medications: MedicationOverview[];
  medicationExecutionsByMedicationId: Record<
    string,
    MedicationExecutionOverview[]
  >;
  recordingMedicationExecutionId: string | null;
  activeMedicationCount: number;
  residentOptions: ReadonlyArray<SelectFieldOption>;
  selectedResidentIds: ReadonlyArray<string>;
  onSelectedResidentIdsChange: (nextValues: string[]) => void;
  onCreateMedicationExecution: (
    medication: MedicationOverview,
    result: MedicationExecutionResult,
  ) => void | Promise<MedicationExecutionOverview | null>;
  filterSummary: string;
  isFiltered?: boolean;
  emptyStateMessage?: string;
}

const medicationExecutionActions: Array<{
  result: MedicationExecutionResult;
  label: string;
  buttonClassName: string;
  badgeClassName: string;
}> = [
  {
    result: 'administered',
    label: 'Administrada',
    buttonClassName:
      'border-[rgba(0,102,132,0.18)] bg-[rgba(0,102,132,0.08)] text-brand-primary',
    badgeClassName: 'bg-brand-primary/12 text-brand-primary',
  },
  {
    result: 'omitted',
    label: 'Omitida',
    buttonClassName:
      'border-[rgba(164,115,0,0.18)] bg-[rgba(164,115,0,0.08)] text-[rgb(121,85,8)]',
    badgeClassName: 'bg-[rgba(164,115,0,0.12)] text-[rgb(121,85,8)]',
  },
  {
    result: 'rejected',
    label: 'Rechazada',
    buttonClassName:
      'border-[rgba(168,43,17,0.16)] bg-[rgba(168,43,17,0.08)] text-[rgb(130,44,25)]',
    badgeClassName: 'bg-[rgba(168,43,17,0.12)] text-[rgb(130,44,25)]',
  },
];

const executionDateTimeFormatter = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatExecutionDateTime(value: string): string {
  return executionDateTimeFormatter.format(new Date(value));
}

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

export function MedicationOrdersPanel({
  medications,
  medicationExecutionsByMedicationId,
  recordingMedicationExecutionId,
  activeMedicationCount,
  residentOptions,
  selectedResidentIds,
  onSelectedResidentIdsChange,
  onCreateMedicationExecution,
  filterSummary,
  isFiltered = false,
  emptyStateMessage = 'Todavia no hay ordenes de medicacion cargadas.',
}: MedicationOrdersPanelProps) {
  const pendingMedicationCount = Math.max(
    medications.length - activeMedicationCount,
    0,
  );

  return (
    <article className={surfaceCardClassName}>
      <div className="mb-[18px] flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-primary">
            Medicacion
          </span>
          <h2 className="mt-1 text-[1.35rem] font-bold tracking-[-0.04em] text-brand-text">
            Ordenes activas y programadas
          </h2>
        </div>

        <Link
          className={primaryButtonClassName}
          data-testid="medication-orders-create-button"
          to="/medicacion/nueva"
        >
          Nueva orden
        </Link>
      </div>

      <div className="mb-4 grid gap-4 rounded-[24px] border border-[rgba(0,102,132,0.08)] bg-brand-neutral/45 p-4 min-[1080px]:grid-cols-[minmax(0,340px)_auto] min-[1080px]:items-end">
        <label className="grid gap-2.5">
          <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
            Filtrar por paciente
          </span>
          <MultiSelectField
            name="residentMedicationFilter"
            testId="medication-resident-filter"
            values={selectedResidentIds}
            options={residentOptions}
            placeholder="Todos los pacientes"
            searchPlaceholder="Buscar paciente o habitacion"
            onChange={onSelectedResidentIdsChange}
          />
        </label>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="max-w-[64ch] leading-[1.65] text-brand-text-secondary">
            {filterSummary}
          </p>

          {selectedResidentIds.length > 0 ? (
            <button
              className={secondaryButtonClassName}
              type="button"
              onClick={() => {
                onSelectedResidentIdsChange([]);
              }}
            >
              Limpiar filtro
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 min-[860px]:grid-cols-3">
        <SummaryTile
          label={isFiltered ? 'Ordenes visibles' : 'Ordenes totales'}
          value={medications.length}
        />
        <SummaryTile
          label={isFiltered ? 'Activas visibles' : 'Activas hoy'}
          value={activeMedicationCount}
        />
        <SummaryTile
          label="Pendientes o cerradas"
          value={pendingMedicationCount}
        />
      </div>

      {medications.length === 0 ? (
        <div className="mt-4 rounded-[24px] border border-dashed border-[rgba(0,102,132,0.22)] bg-brand-neutral/60 px-5 py-5 text-brand-text-secondary">
          {emptyStateMessage}
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {medications.map((order) => {
            const executions =
              medicationExecutionsByMedicationId[order.id] ?? [];
            const isRecordingExecution =
              recordingMedicationExecutionId === order.id;

            return (
              <article
                key={order.id}
                data-testid={`medication-order-${order.id}`}
                className="rounded-[24px] border border-[rgba(0,102,132,0.08)] bg-brand-neutral/70 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="grid gap-1">
                    <strong className="text-[1.05rem] text-brand-text">
                      {order.medicationName}
                    </strong>
                    <span className="leading-[1.55] text-brand-text-secondary">
                      {order.residentName}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={[
                        badgeBaseClassName,
                        order.active
                          ? 'bg-brand-primary/12 text-brand-primary'
                          : 'bg-brand-tertiary/14 text-brand-tertiary',
                      ].join(' ')}
                    >
                      {order.active
                        ? 'Activa hoy'
                        : formatEntityStatus(order.status)}
                    </span>

                    <Link
                      data-testid={`medication-edit-${order.id}`}
                      className={secondaryButtonClassName}
                      to={`/medicacion/${order.id}/editar`}
                    >
                      Editar
                    </Link>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 min-[920px]:grid-cols-4">
                  <div className="grid gap-1">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
                      Dosis
                    </span>
                    <span className="text-brand-text">{order.dose}</span>
                  </div>

                  <div className="grid gap-1">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
                      Via
                    </span>
                    <span className="text-brand-text">
                      {formatMedicationRoute(order.route)}
                    </span>
                  </div>

                  <div className="grid gap-1">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
                      Frecuencia
                    </span>
                    <span className="text-brand-text">
                      {formatMedicationFrequency(order.frequency)}
                    </span>
                  </div>

                  <div className="grid gap-1">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
                      Vigencia
                    </span>
                    <span className="text-brand-text">
                      {order.startDate.slice(0, 10)}
                      {order.endDate
                        ? ` al ${order.endDate.slice(0, 10)}`
                        : ' sin fin'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-1">
                  <span className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
                    Agenda
                  </span>
                  <span className="text-brand-text">{order.schedule}</span>
                  <span className="text-brand-text-secondary">
                    Prescripto por {order.prescribedBy}
                  </span>
                </div>

                <section className="mt-5 grid gap-4 rounded-[22px] border border-[rgba(0,102,132,0.08)] bg-white/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="grid gap-1">
                      <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                        Registro operativo
                      </span>
                      <p className="max-w-[58ch] leading-[1.55] text-brand-text-secondary">
                        Marca una toma sin editar la orden base. Cada accion
                        queda registrada como ejecucion independiente.
                      </p>
                    </div>

                    {order.active ? (
                      <div className="flex flex-wrap gap-2">
                        {medicationExecutionActions.map((action) => (
                          <button
                            key={action.result}
                            className={`${secondaryButtonClassName} min-w-[140px] ${action.buttonClassName} ${isRecordingExecution ? 'cursor-wait opacity-70' : ''}`}
                            type="button"
                            disabled={isRecordingExecution}
                            onClick={() => {
                              void onCreateMedicationExecution(
                                order,
                                action.result,
                              );
                            }}
                          >
                            {isRecordingExecution
                              ? 'Guardando...'
                              : action.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="max-w-[32ch] text-right leading-[1.55] text-brand-text-secondary">
                        La orden no esta activa hoy, por eso no admite nuevas
                        ejecuciones.
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
                        Ultimas ejecuciones
                      </span>
                      <span className="text-[0.9rem] text-brand-text-secondary">
                        {executions.length === 0
                          ? 'Sin registros'
                          : `${executions.length} registro${executions.length === 1 ? '' : 's'}`}
                      </span>
                    </div>

                    {executions.length === 0 ? (
                      <div className="rounded-[20px] border border-dashed border-[rgba(0,102,132,0.18)] bg-brand-neutral/45 px-4 py-4 text-brand-text-secondary">
                        Todavia no hay ejecuciones registradas para esta orden.
                      </div>
                    ) : (
                      <div className="grid gap-2.5">
                        {executions.slice(0, 3).map((execution) => {
                          const executionAction =
                            medicationExecutionActions.find(
                              (action) => action.result === execution.result,
                            ) ?? medicationExecutionActions[0];

                          return (
                            <article
                              key={execution.id}
                              className="flex flex-wrap items-start justify-between gap-3 rounded-[20px] border border-[rgba(0,102,132,0.08)] bg-brand-neutral/55 px-4 py-4"
                            >
                              <div className="grid gap-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`${badgeBaseClassName} ${executionAction.badgeClassName}`}
                                  >
                                    {formatMedicationExecutionResult(
                                      execution.result,
                                    )}
                                  </span>
                                  <strong className="text-brand-text">
                                    {execution.medicationName}
                                  </strong>
                                </div>
                                <span className="leading-[1.55] text-brand-text-secondary">
                                  Registrada el{' '}
                                  {formatExecutionDateTime(
                                    execution.occurredAt,
                                  )}
                                </span>
                              </div>

                              <div className="grid gap-1 text-right text-brand-text-secondary">
                                <span>Actor</span>
                                <strong className="text-brand-text">
                                  {execution.actor}
                                </strong>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </section>
              </article>
            );
          })}
        </div>
      )}
    </article>
  );
}
