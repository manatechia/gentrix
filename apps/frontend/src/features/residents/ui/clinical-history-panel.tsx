import { useState } from 'react';

import type {
  ClinicalHistoryEvent,
  ClinicalHistoryEventCreateInput,
} from '@gentrix/shared-types';

import {
  formatCurrentDateForResidentInput,
  formatResidentDateInput,
  isResidentDateInFuture,
  toResidentDateIso,
} from '../lib/resident-form-utils';
import {
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  surfaceCardClassName,
} from '../../../shared/ui/class-names';
import { SelectField } from '../../../shared/ui/select-field';

interface ClinicalHistoryPanelProps {
  events: ClinicalHistoryEvent[];
  isSavingEvent: boolean;
  notice: string | null;
  noticeTone: 'success' | 'error';
  onCreate: (
    input: ClinicalHistoryEventCreateInput,
  ) => Promise<ClinicalHistoryEvent | null>;
}

interface ClinicalHistoryFormState {
  eventType: string;
  title: string;
  occurredAt: string;
  description: string;
}

const clinicalHistoryEventTypeOptions = [
  { value: 'medical-history', label: 'Antecedente general' },
  { value: 'diagnosis', label: 'Diagnostico' },
  { value: 'surgery', label: 'Cirugia' },
  { value: 'hospitalization', label: 'Internacion' },
  { value: 'clinical-note', label: 'Nota clinica' },
] as const;

const clinicalHistoryEventTypeLabels = new Map<string, string>(
  clinicalHistoryEventTypeOptions.map((option) => [option.value, option.label]),
);

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'long',
});

function createInitialFormState(): ClinicalHistoryFormState {
  return {
    eventType: 'medical-history',
    title: '',
    occurredAt: formatCurrentDateForResidentInput(),
    description: '',
  };
}

function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

function formatClinicalHistoryEventType(value: string): string {
  return clinicalHistoryEventTypeLabels.get(value) ?? value;
}

export function ClinicalHistoryPanel({
  events,
  isSavingEvent,
  notice,
  noticeTone,
  onCreate,
}: ClinicalHistoryPanelProps) {
  const [formState, setFormState] = useState<ClinicalHistoryFormState>(
    createInitialFormState,
  );
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(): Promise<void> {
    const title = formState.title.trim();
    const description = formState.description.trim();
    const occurredAt = toResidentDateIso(formState.occurredAt);

    if (!formState.eventType) {
      setFormError('Selecciona el tipo de evento clinico.');
      return;
    }

    if (!occurredAt) {
      setFormError('Ingresa la fecha con formato DD/MM/YYYY.');
      return;
    }

    if (isResidentDateInFuture(formState.occurredAt)) {
      setFormError('La fecha del evento no puede estar en el futuro.');
      return;
    }

    if (!title) {
      setFormError('El titulo del evento es obligatorio.');
      return;
    }

    if (!description) {
      setFormError('El detalle del evento es obligatorio.');
      return;
    }

    setFormError(null);

    const createdEvent = await onCreate({
      eventType: formState.eventType,
      title,
      description,
      occurredAt,
    });

    if (!createdEvent) {
      return;
    }

    setFormState(createInitialFormState());
  }

  return (
    <section
      className={`${surfaceCardClassName} grid gap-5`}
      data-testid="clinical-history-panel"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1.5">
          <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
            Timeline clinico
          </span>
          <p className="max-w-[68ch] leading-[1.65] text-brand-text-secondary">
            Cada nuevo evento se agrega al historial cronologico del residente y
            no reemplaza los antecedentes anteriores.
          </p>
        </div>
        <span className="rounded-full bg-brand-primary/10 px-3 py-2 text-[0.82rem] font-semibold text-brand-primary">
          {events.length} eventos
        </span>
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
            Agregar evento
          </span>
          <button
            data-testid="clinical-history-submit-button"
            className={primaryButtonClassName}
            type="button"
            disabled={isSavingEvent}
            onClick={() => {
              void handleSubmit();
            }}
          >
            {isSavingEvent ? 'Guardando...' : 'Guardar evento'}
          </button>
        </div>

        <div className="mt-4 grid gap-[14px] min-[980px]:grid-cols-[220px_220px_minmax(0,1fr)]">
          <label className="grid gap-2.5">
            <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
              Tipo
            </span>
            <SelectField
              name="clinicalHistory.eventType"
              testId="clinical-history-event-type-select"
              value={formState.eventType}
              options={clinicalHistoryEventTypeOptions}
              onChange={(nextValue) => {
                setFormState((current) => ({
                  ...current,
                  eventType: nextValue,
                }));
              }}
            />
          </label>

          <label className="grid gap-2.5">
            <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
              Fecha del evento
            </span>
            <input
              data-testid="clinical-history-date-input"
              className={inputClassName}
              type="text"
              inputMode="numeric"
              maxLength={10}
              placeholder="DD/MM/YYYY"
              value={formState.occurredAt}
              onChange={(event) => {
                setFormState((current) => ({
                  ...current,
                  occurredAt: formatResidentDateInput(event.target.value),
                }));
              }}
            />
          </label>

          <label className="grid gap-2.5">
            <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
              Titulo
            </span>
            <input
              data-testid="clinical-history-title-input"
              className={inputClassName}
              type="text"
              value={formState.title}
              onChange={(event) => {
                setFormState((current) => ({
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
            data-testid="clinical-history-description-input"
            className={`${inputClassName} min-h-[132px] py-3`}
            value={formState.description}
            onChange={(event) => {
              setFormState((current) => ({
                ...current,
                description: event.target.value,
              }));
            }}
          />
        </label>
      </article>

      <div className="grid gap-3">
        {events.length === 0 ? (
          <article className="rounded-[24px] border border-dashed border-[rgba(0,102,132,0.22)] bg-white/70 px-5 py-5 text-brand-text-secondary">
            Aun no hay eventos clinicos registrados para este residente.
          </article>
        ) : (
          events.map((event) => (
            <article
              key={event.id}
              data-testid={`clinical-history-event-${event.id}`}
              className="rounded-[24px] border border-[rgba(0,102,132,0.08)] bg-white/85 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="grid gap-2">
                  <span className="inline-flex w-fit rounded-full bg-brand-primary/10 px-3 py-1 text-[0.74rem] font-semibold uppercase tracking-[0.14em] text-brand-primary">
                    {formatClinicalHistoryEventType(event.eventType)}
                  </span>
                  <strong className="text-[1.05rem] text-brand-text">
                    {event.title}
                  </strong>
                </div>

                <div className="grid justify-items-start gap-1 text-left text-[0.92rem] text-brand-text-secondary min-[680px]:justify-items-end min-[680px]:text-right">
                  <span>{formatDate(event.occurredAt)}</span>
                  <span>Registrado por {event.audit.createdBy}</span>
                </div>
              </div>

              <p className="mt-3 leading-[1.65] text-brand-text-secondary">
                {event.description}
              </p>

              <div className="mt-4 flex justify-end">
                <button
                  className={secondaryButtonClassName}
                  type="button"
                  disabled
                >
                  Append-only
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
