import { useState } from 'react';

import type {
  ResidentObservation,
  ResidentObservationCreateInput,
  ResidentObservationEntryCreateInput,
  ResidentObservationResolveInput,
} from '@gentrix/shared-types';

import {
  formatResidentObservationEntryType,
  formatResidentObservationResolutionType,
  formatResidentObservationSeverity,
  formatResidentObservationStatus,
} from '../../../shared/lib/display-labels';
import {
  badgeBaseClassName,
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  surfaceCardClassName,
} from '../../../shared/ui/class-names';
import { SelectField } from '../../../shared/ui/select-field';

interface ResidentObservationsPanelProps {
  observations: ResidentObservation[];
  isSavingObservation: boolean;
  activeObservationMutationId: string | null;
  notice: string | null;
  noticeTone: 'success' | 'error';
  onCreate: (
    input: ResidentObservationCreateInput,
  ) => Promise<ResidentObservation | null>;
  onCreateEntry: (
    observationId: string,
    input: ResidentObservationEntryCreateInput,
  ) => Promise<ResidentObservation | null>;
  onResolve: (
    observationId: string,
    input: ResidentObservationResolveInput,
  ) => Promise<ResidentObservation | null>;
}

interface ObservationCreateFormState {
  severity: ResidentObservationCreateInput['severity'];
  title: string;
  description: string;
}

interface ObservationEntryFormState {
  entryType: ResidentObservationEntryCreateInput['entryType'];
  title: string;
  description: string;
}

interface ObservationResolveFormState {
  resolutionType: ResidentObservationResolveInput['resolutionType'];
  summary: string;
}

const observationSeverityOptions = [
  { value: 'warning', label: 'Seguimiento' },
  { value: 'critical', label: 'Critica' },
] as const;

const observationEntryTypeOptions = [
  { value: 'follow-up', label: 'Seguimiento' },
  { value: 'action', label: 'Accion' },
] as const;

const observationResolutionOptions = [
  { value: 'completed', label: 'Finalizada' },
  { value: 'phone-call', label: 'Llamado' },
  { value: 'medical-visit', label: 'Visita medica' },
] as const;

const dateTimeFormatter = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'long',
  timeStyle: 'short',
});

const severityBadgeClassNames: Record<
  ResidentObservation['severity'],
  string
> = {
  warning:
    'border border-[rgba(166,89,42,0.2)] bg-[rgba(255,236,214,0.76)] text-[rgb(138,72,36)]',
  critical:
    'border border-[rgba(143,38,38,0.2)] bg-[rgba(255,223,223,0.86)] text-[rgb(127,28,28)]',
};

const statusBadgeClassNames: Record<ResidentObservation['status'], string> = {
  active:
    'border border-[rgba(0,102,132,0.14)] bg-[rgba(0,102,132,0.08)] text-brand-primary',
  resolved:
    'border border-[rgba(47,79,79,0.12)] bg-white text-brand-text-secondary',
};

function createObservationFormState(): ObservationCreateFormState {
  return {
    severity: 'warning',
    title: '',
    description: '',
  };
}

function createObservationEntryFormState(): ObservationEntryFormState {
  return {
    entryType: 'follow-up',
    title: '',
    description: '',
  };
}

function createObservationResolveFormState(): ObservationResolveFormState {
  return {
    resolutionType: 'completed',
    summary: '',
  };
}

function formatDateTime(value: string): string {
  return dateTimeFormatter.format(new Date(value));
}

export function ResidentObservationsPanel({
  observations,
  isSavingObservation,
  activeObservationMutationId,
  notice,
  noticeTone,
  onCreate,
  onCreateEntry,
  onResolve,
}: ResidentObservationsPanelProps) {
  const [createFormState, setCreateFormState] = useState<ObservationCreateFormState>(
    createObservationFormState,
  );
  const [entryForms, setEntryForms] = useState<
    Record<string, ObservationEntryFormState>
  >({});
  const [resolveForms, setResolveForms] = useState<
    Record<string, ObservationResolveFormState>
  >({});
  const [formError, setFormError] = useState<string | null>(null);

  const activeCount = observations.filter(
    (observation) => observation.status === 'active',
  ).length;
  const resolvedCount = observations.length - activeCount;

  const handleCreateSubmit = async (): Promise<void> => {
    const title = createFormState.title.trim();
    const description = createFormState.description.trim();

    if (!title) {
      setFormError('La observacion necesita un titulo corto.');
      return;
    }

    if (!description) {
      setFormError('La observacion necesita un detalle operativo.');
      return;
    }

    setFormError(null);

    const createdObservation = await onCreate({
      severity: createFormState.severity,
      title,
      description,
    });

    if (!createdObservation) {
      return;
    }

    setCreateFormState(createObservationFormState());
  };

  const handleEntrySubmit = async (observationId: string): Promise<void> => {
    const entryForm = entryForms[observationId] ?? createObservationEntryFormState();
    const title = entryForm.title.trim();
    const description = entryForm.description.trim();

    if (!title) {
      setFormError('El seguimiento necesita un titulo corto.');
      return;
    }

    if (!description) {
      setFormError('El seguimiento necesita un detalle.');
      return;
    }

    setFormError(null);

    const updatedObservation = await onCreateEntry(observationId, {
      entryType: entryForm.entryType,
      title,
      description,
    });

    if (!updatedObservation) {
      return;
    }

    setEntryForms((current) => ({
      ...current,
      [observationId]: createObservationEntryFormState(),
    }));
  };

  const handleResolveSubmit = async (observationId: string): Promise<void> => {
    const resolveForm =
      resolveForms[observationId] ?? createObservationResolveFormState();
    const summary = resolveForm.summary.trim();

    if (!summary) {
      setFormError('El cierre necesita un resumen final.');
      return;
    }

    setFormError(null);

    const updatedObservation = await onResolve(observationId, {
      resolutionType: resolveForm.resolutionType,
      summary,
    });

    if (!updatedObservation) {
      return;
    }

    setResolveForms((current) => ({
      ...current,
      [observationId]: createObservationResolveFormState(),
    }));
  };

  return (
    <section
      className={`${surfaceCardClassName} grid gap-5`}
      data-testid="resident-observations-panel"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1.5">
          <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
            Observacion operativa
          </span>
          <p className="max-w-[68ch] leading-[1.65] text-brand-text-secondary">
            Abre un seguimiento cuando algo sale de lo esperado, agrega acciones
            dentro del mismo caso y cerralo con un desenlace claro.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-brand-primary/10 px-3 py-2 text-[0.82rem] font-semibold text-brand-primary">
            {activeCount} activas
          </span>
          <span className="rounded-full border border-[rgba(47,79,79,0.14)] bg-white px-3 py-2 text-[0.82rem] font-semibold text-brand-text-secondary">
            {resolvedCount} resueltas
          </span>
        </div>
      </div>

      {(notice || formError) && (
        <div
          className={`rounded-[18px] px-4 py-3.5 text-[0.95rem] leading-[1.55] ${
            (formError ?? notice) && (formError || noticeTone === 'error')
              ? 'border border-[rgba(168,43,17,0.16)] bg-[rgba(168,43,17,0.08)] text-[rgb(130,44,25)]'
              : 'border border-[rgba(0,102,132,0.14)] bg-[rgba(0,102,132,0.08)] text-brand-secondary'
          }`}
        >
          {formError ?? notice}
        </div>
      )}

      <article className="rounded-[24px] border border-[rgba(0,102,132,0.08)] bg-brand-neutral/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
            Abrir observacion
          </span>
          <button
            data-testid="resident-observation-create-submit-button"
            className={primaryButtonClassName}
            type="button"
            disabled={isSavingObservation}
            onClick={() => {
              void handleCreateSubmit();
            }}
          >
            {isSavingObservation && activeObservationMutationId === 'create'
              ? 'Guardando...'
              : 'Abrir observacion'}
          </button>
        </div>

        <div className="mt-4 grid gap-[14px] min-[980px]:grid-cols-[220px_minmax(0,1fr)]">
          <label className="grid gap-2.5">
            <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
              Gravedad
            </span>
            <SelectField
              name="residentObservation.severity"
              testId="resident-observation-severity-select"
              value={createFormState.severity}
              options={observationSeverityOptions}
              onChange={(nextValue) => {
                setCreateFormState((current) => ({
                  ...current,
                  severity: nextValue as ObservationCreateFormState['severity'],
                }));
              }}
            />
          </label>

          <label className="grid gap-2.5">
            <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
              Titulo
            </span>
            <input
              data-testid="resident-observation-title-input"
              className={inputClassName}
              type="text"
              value={createFormState.title}
              onChange={(event) => {
                setCreateFormState((current) => ({
                  ...current,
                  title: event.target.value,
                }));
              }}
            />
          </label>
        </div>

        <label className="mt-[14px] grid gap-2.5">
          <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
            Detalle
          </span>
          <textarea
            data-testid="resident-observation-description-input"
            className={`${inputClassName} min-h-[120px] py-3`}
            value={createFormState.description}
            onChange={(event) => {
              setCreateFormState((current) => ({
                ...current,
                description: event.target.value,
              }));
            }}
          />
        </label>
      </article>

      <div className="grid gap-3">
        {observations.length === 0 ? (
          <article className="rounded-[24px] border border-dashed border-[rgba(0,102,132,0.22)] bg-white/70 px-5 py-5 text-brand-text-secondary">
            Aun no hay observaciones abiertas o resueltas para este residente.
          </article>
        ) : (
          observations.map((observation) => {
            const entryForm =
              entryForms[observation.id] ?? createObservationEntryFormState();
            const resolveForm =
              resolveForms[observation.id] ?? createObservationResolveFormState();
            const isMutatingThisObservation =
              isSavingObservation &&
              activeObservationMutationId === observation.id;

            return (
              <article
                key={observation.id}
                data-testid={`resident-observation-card-${observation.id}`}
                className="rounded-[24px] border border-[rgba(0,102,132,0.08)] bg-white/85 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="grid gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={[
                          badgeBaseClassName,
                          severityBadgeClassNames[observation.severity],
                        ].join(' ')}
                      >
                        {formatResidentObservationSeverity(observation.severity)}
                      </span>
                      <span
                        className={[
                          badgeBaseClassName,
                          statusBadgeClassNames[observation.status],
                        ].join(' ')}
                      >
                        {formatResidentObservationStatus(observation.status)}
                      </span>
                    </div>
                    <strong className="text-[1.05rem] text-brand-text">
                      {observation.title}
                    </strong>
                    <p className="leading-[1.65] text-brand-text-secondary">
                      {observation.description}
                    </p>
                  </div>

                  <div className="grid gap-1 text-left text-[0.92rem] text-brand-text-secondary min-[680px]:justify-items-end min-[680px]:text-right">
                    <span>Abierta {formatDateTime(observation.openedAt)}</span>
                    <span>{observation.openedBy}</span>
                    {observation.resolvedAt && (
                      <span>
                        Cerrada {formatDateTime(observation.resolvedAt)}
                      </span>
                    )}
                  </div>
                </div>

                {observation.status === 'active' && (
                  <div className="mt-5 grid gap-4 min-[1100px]:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
                    <section className="rounded-[22px] border border-[rgba(0,102,132,0.08)] bg-brand-neutral/50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                          Seguimiento o accion
                        </span>
                        <button
                          data-testid={`resident-observation-entry-submit-${observation.id}`}
                          className={primaryButtonClassName}
                          type="button"
                          disabled={isMutatingThisObservation}
                          onClick={() => {
                            void handleEntrySubmit(observation.id);
                          }}
                        >
                          {isMutatingThisObservation
                            ? 'Guardando...'
                            : 'Guardar seguimiento'}
                        </button>
                      </div>

                      <div className="mt-4 grid gap-[14px] min-[980px]:grid-cols-[220px_minmax(0,1fr)]">
                        <label className="grid gap-2.5">
                          <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                            Tipo
                          </span>
                          <SelectField
                            name={`residentObservation.entryType.${observation.id}`}
                            testId={`resident-observation-entry-type-select-${observation.id}`}
                            value={entryForm.entryType}
                            options={observationEntryTypeOptions}
                            onChange={(nextValue) => {
                              setEntryForms((current) => ({
                                ...current,
                                [observation.id]: {
                                  ...entryForm,
                                  entryType:
                                    nextValue as ObservationEntryFormState['entryType'],
                                },
                              }));
                            }}
                          />
                        </label>

                        <label className="grid gap-2.5">
                          <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                            Titulo
                          </span>
                          <input
                            data-testid={`resident-observation-entry-title-input-${observation.id}`}
                            className={inputClassName}
                            type="text"
                            value={entryForm.title}
                            onChange={(event) => {
                              setEntryForms((current) => ({
                                ...current,
                                [observation.id]: {
                                  ...entryForm,
                                  title: event.target.value,
                                },
                              }));
                            }}
                          />
                        </label>
                      </div>

                      <label className="mt-[14px] grid gap-2.5">
                        <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                          Detalle
                        </span>
                        <textarea
                          data-testid={`resident-observation-entry-description-input-${observation.id}`}
                          className={`${inputClassName} min-h-[110px] py-3`}
                          value={entryForm.description}
                          onChange={(event) => {
                            setEntryForms((current) => ({
                              ...current,
                              [observation.id]: {
                                ...entryForm,
                                description: event.target.value,
                              },
                            }));
                          }}
                        />
                      </label>
                    </section>

                    <section className="rounded-[22px] border border-[rgba(0,102,132,0.08)] bg-brand-neutral/50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                          Cerrar observacion
                        </span>
                        <button
                          data-testid={`resident-observation-resolve-submit-${observation.id}`}
                          className={secondaryButtonClassName}
                          type="button"
                          disabled={isMutatingThisObservation}
                          onClick={() => {
                            void handleResolveSubmit(observation.id);
                          }}
                        >
                          {isMutatingThisObservation
                            ? 'Guardando...'
                            : 'Cerrar caso'}
                        </button>
                      </div>

                      <div className="mt-4 grid gap-[14px]">
                        <label className="grid gap-2.5">
                          <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                            Desenlace
                          </span>
                          <SelectField
                            name={`residentObservation.resolveType.${observation.id}`}
                            testId={`resident-observation-resolution-type-select-${observation.id}`}
                            value={resolveForm.resolutionType}
                            options={observationResolutionOptions}
                            onChange={(nextValue) => {
                              setResolveForms((current) => ({
                                ...current,
                                [observation.id]: {
                                  ...resolveForm,
                                  resolutionType:
                                    nextValue as ObservationResolveFormState['resolutionType'],
                                },
                              }));
                            }}
                          />
                        </label>

                        <label className="grid gap-2.5">
                          <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                            Resumen final
                          </span>
                          <textarea
                            data-testid={`resident-observation-resolution-summary-input-${observation.id}`}
                            className={`${inputClassName} min-h-[130px] py-3`}
                            value={resolveForm.summary}
                            onChange={(event) => {
                              setResolveForms((current) => ({
                                ...current,
                                [observation.id]: {
                                  ...resolveForm,
                                  summary: event.target.value,
                                },
                              }));
                            }}
                          />
                        </label>
                      </div>
                    </section>
                  </div>
                )}

                <div className="mt-5 grid gap-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                      Historial interno
                    </span>
                    <span className="text-[0.9rem] text-brand-text-secondary">
                      {observation.entries.length === 0
                        ? 'Sin movimientos'
                        : `${observation.entries.length} movimiento${observation.entries.length === 1 ? '' : 's'}`}
                    </span>
                  </div>

                  {observation.entries.length === 0 ? (
                    <article className="rounded-[20px] border border-dashed border-[rgba(0,102,132,0.18)] bg-white/65 px-4 py-4 text-brand-text-secondary">
                      Aun no hay seguimientos registrados dentro de esta
                      observacion.
                    </article>
                  ) : (
                    observation.entries.map((entry) => (
                      <article
                        key={entry.id}
                        className="rounded-[20px] border border-[rgba(0,102,132,0.08)] bg-white/78 px-4 py-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="grid gap-1">
                            <span className="inline-flex w-fit rounded-full bg-brand-primary/10 px-3 py-1 text-[0.74rem] font-semibold uppercase tracking-[0.14em] text-brand-primary">
                              {formatResidentObservationEntryType(entry.entryType)}
                            </span>
                            <strong className="text-brand-text">
                              {entry.title}
                            </strong>
                            <p className="leading-[1.55] text-brand-text-secondary">
                              {entry.description}
                            </p>
                          </div>

                          <div className="grid gap-1 text-left text-[0.92rem] text-brand-text-secondary min-[680px]:justify-items-end min-[680px]:text-right">
                            <span>{formatDateTime(entry.occurredAt)}</span>
                            <strong className="text-brand-text">
                              {entry.actor}
                            </strong>
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>

                {observation.status === 'resolved' && observation.resolutionType && (
                  <div className="mt-4 rounded-[20px] border border-[rgba(47,79,79,0.12)] bg-brand-neutral/50 px-4 py-4 text-brand-text-secondary">
                    <strong className="block text-brand-text">
                      {formatResidentObservationResolutionType(
                        observation.resolutionType,
                      )}
                    </strong>
                    <span className="mt-1 block">
                      {observation.resolutionSummary}
                    </span>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
