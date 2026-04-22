import { useMemo, useState } from 'react';

import type {
  ResidentAgendaEventCreateInput,
  ResidentAgendaEventUpdateInput,
  ResidentAgendaOccurrence,
  ResidentAgendaOccurrenceOverrideInput,
  ResidentAgendaRecurrenceType,
  ResidentAgendaSeriesCreateInput,
  ResidentAgendaSeriesUpdateInput,
} from '@gentrix/shared-types';

import {
  WEEKDAY_LABELS,
  agendaInputDateToYmd,
  combineAgendaDateTime,
  formatAgendaDateInput,
  formatAgendaRecurrenceBadge,
  formatAgendaTimeInput,
  formatAgendaTime,
  isAgendaDateTimeInFuture,
  ymdToAgendaInputDate,
} from '../lib/resident-agenda-utils';
import {
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  surfaceCardClassName,
} from '../../../shared/ui/class-names';
import { SelectField } from '../../../shared/ui/select-field';

const RECURRENCE_OPTIONS = [
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'yearly', label: 'Anual' },
] as const;

interface ResidentAgendaPanelProps {
  occurrences: ResidentAgendaOccurrence[];
  isSavingEvent: boolean;
  activeMutationId: string | null;
  notice: string | null;
  noticeTone: 'success' | 'error';
  onEventCreate: (
    input: ResidentAgendaEventCreateInput,
  ) => Promise<unknown>;
  onEventUpdate: (
    eventId: string,
    input: ResidentAgendaEventUpdateInput,
  ) => Promise<unknown>;
  onEventDelete: (eventId: string) => Promise<boolean>;
  onSeriesCreate: (
    input: ResidentAgendaSeriesCreateInput,
  ) => Promise<unknown>;
  onSeriesUpdate: (
    seriesId: string,
    input: ResidentAgendaSeriesUpdateInput,
  ) => Promise<unknown>;
  onSeriesDelete: (seriesId: string) => Promise<boolean>;
  onOccurrenceSkip: (
    seriesId: string,
    occurrenceDate: string,
  ) => Promise<boolean>;
  onOccurrenceOverride: (
    seriesId: string,
    occurrenceDate: string,
    input: ResidentAgendaOccurrenceOverrideInput,
  ) => Promise<boolean>;
}

interface FormState {
  title: string;
  description: string;
  date: string; // DD/MM/YYYY
  time: string; // HH:mm
  isRecurring: boolean;
  recurrenceType: ResidentAgendaRecurrenceType;
  daysOfWeek: number[];
  endsOn: string; // DD/MM/YYYY opcional
}

function createInitialFormState(): FormState {
  return {
    title: '',
    description: '',
    date: '',
    time: '',
    isRecurring: false,
    recurrenceType: 'daily',
    daysOfWeek: [],
    endsOn: '',
  };
}

function validateCreateForm(state: FormState): string | null {
  if (state.title.trim().length === 0) {
    return 'El titulo del evento es obligatorio.';
  }
  if (!/^\d{2}:\d{2}$/.test(state.time)) {
    return 'Ingresa una hora HH:mm.';
  }
  if (state.isRecurring) {
    const startsYmd = agendaInputDateToYmd(state.date);
    if (!startsYmd) {
      return 'Ingresa la fecha de inicio DD/MM/YYYY.';
    }
    if (state.recurrenceType === 'weekly' && state.daysOfWeek.length === 0) {
      return 'Seleccioná al menos un día de la semana.';
    }
    if (state.endsOn) {
      const endsYmd = agendaInputDateToYmd(state.endsOn);
      if (!endsYmd) return 'Fecha de fin invalida.';
      if (endsYmd < startsYmd) return 'La fecha de fin debe ser posterior al inicio.';
    }
    return null;
  }
  // one-off
  const iso = combineAgendaDateTime(state.date, state.time);
  if (!iso) return 'Ingresa fecha DD/MM/YYYY y hora HH:mm validas.';
  if (!isAgendaDateTimeInFuture(state.date, state.time)) {
    return 'La fecha y hora del evento debe estar en el futuro.';
  }
  return null;
}

/**
 * Panel "Próximos eventos" de la ficha del residente. Muestra las ocurrencias
 * del día (eventos one-off + series expandidas) con acciones por ocurrencia:
 *   - Eventos one-off: editar / eliminar directamente.
 *   - Ocurrencias de series: selector inline "solo hoy" vs "toda la serie".
 */
export function ResidentAgendaPanel({
  occurrences,
  isSavingEvent,
  activeMutationId,
  notice,
  noticeTone,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  onSeriesCreate,
  onSeriesUpdate,
  onSeriesDelete,
  onOccurrenceSkip,
  onOccurrenceOverride,
}: ResidentAgendaPanelProps) {
  const [formState, setFormState] = useState<FormState>(createInitialFormState);
  const [formError, setFormError] = useState<string | null>(null);

  const occurrencesList = useMemo(
    () =>
      [...occurrences].sort(
        (l, r) =>
          new Date(l.scheduledAt).getTime() -
          new Date(r.scheduledAt).getTime(),
      ),
    [occurrences],
  );

  async function handleCreate(): Promise<void> {
    const validation = validateCreateForm(formState);
    if (validation) {
      setFormError(validation);
      return;
    }
    setFormError(null);
    if (formState.isRecurring) {
      const startsOn = agendaInputDateToYmd(formState.date)!;
      const endsOn = formState.endsOn
        ? (agendaInputDateToYmd(formState.endsOn) ?? undefined)
        : undefined;
      const created = await onSeriesCreate({
        title: formState.title.trim(),
        description: formState.description.trim() || undefined,
        recurrenceType: formState.recurrenceType,
        recurrenceDaysOfWeek:
          formState.recurrenceType === 'weekly'
            ? formState.daysOfWeek
            : undefined,
        timeOfDay: formState.time,
        startsOn,
        endsOn,
      });
      if (created) setFormState(createInitialFormState());
      return;
    }
    const scheduledAt = combineAgendaDateTime(formState.date, formState.time);
    if (!scheduledAt) return;
    const created = await onEventCreate({
      title: formState.title.trim(),
      description: formState.description.trim() || undefined,
      scheduledAt,
    });
    if (created) setFormState(createInitialFormState());
  }

  function toggleDayOfWeek(day: number): void {
    setFormState((current) => ({
      ...current,
      daysOfWeek: current.daysOfWeek.includes(day)
        ? current.daysOfWeek.filter((d) => d !== day)
        : [...current.daysOfWeek, day].sort((a, b) => a - b),
    }));
  }

  return (
    <section
      className={`${surfaceCardClassName} grid gap-5`}
      data-testid="resident-agenda-panel"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1.5">
          <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
            Agenda de hoy
          </span>
          <p className="max-w-[68ch] leading-[1.65] text-brand-text-secondary">
            Medicacion, turnos y actividades del dia. Los eventos recurrentes
            (medicacion diaria, por ejemplo) se muestran acá automaticamente.
          </p>
        </div>
        <span className="rounded-full bg-brand-primary/10 px-3 py-2 text-[0.82rem] font-semibold text-brand-primary">
          {occurrencesList.length} hoy
        </span>
      </div>

      {(notice || formError) && (
        <div
          className={`rounded-[18px] px-4 py-3.5 text-[0.95rem] leading-[1.55] ${
            formError || noticeTone === 'error'
              ? 'border border-[rgba(168,43,17,0.16)] bg-[rgba(168,43,17,0.08)] text-[rgb(130,44,25)]'
              : 'border border-[rgba(0,102,132,0.14)] bg-[rgba(0,102,132,0.08)] text-brand-secondary'
          }`}
        >
          {formError ?? notice}
        </div>
      )}

      {/* Form */}
      <article className="rounded-[24px] border border-[rgba(0,102,132,0.08)] bg-brand-neutral/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
            {formState.isRecurring ? 'Nueva serie recurrente' : 'Nuevo evento'}
          </span>
          <button
            data-testid="resident-agenda-submit-button"
            className={primaryButtonClassName}
            type="button"
            disabled={
              isSavingEvent &&
              (activeMutationId === 'create-event' ||
                activeMutationId === 'create-series')
            }
            onClick={() => {
              void handleCreate();
            }}
          >
            {isSavingEvent &&
            (activeMutationId === 'create-event' ||
              activeMutationId === 'create-series')
              ? 'Guardando...'
              : 'Guardar'}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-4 text-[0.92rem]">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="agenda-kind"
              className="h-4 w-4 accent-brand-primary"
              checked={!formState.isRecurring}
              onChange={() =>
                setFormState((c) => ({ ...c, isRecurring: false }))
              }
            />
            Una sola vez
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="agenda-kind"
              className="h-4 w-4 accent-brand-primary"
              checked={formState.isRecurring}
              onChange={() =>
                setFormState((c) => ({ ...c, isRecurring: true }))
              }
            />
            Se repite
          </label>
        </div>

        <div className="mt-4 grid gap-[14px] min-[980px]:grid-cols-[160px_120px_minmax(0,1fr)]">
          <label className="grid gap-2.5">
            <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
              {formState.isRecurring ? 'Desde' : 'Fecha'}
            </span>
            <input
              data-testid="resident-agenda-date-input"
              className={inputClassName}
              type="text"
              inputMode="numeric"
              maxLength={10}
              placeholder="DD/MM/YYYY"
              value={formState.date}
              onChange={(event) => {
                setFormState((current) => ({
                  ...current,
                  date: formatAgendaDateInput(event.target.value),
                }));
              }}
            />
          </label>
          <label className="grid gap-2.5">
            <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
              Hora
            </span>
            <input
              data-testid="resident-agenda-time-input"
              className={inputClassName}
              type="text"
              inputMode="numeric"
              maxLength={5}
              placeholder="HH:mm"
              value={formState.time}
              onChange={(event) => {
                setFormState((current) => ({
                  ...current,
                  time: formatAgendaTimeInput(event.target.value),
                }));
              }}
            />
          </label>
          <label className="grid gap-2.5">
            <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
              Titulo
            </span>
            <input
              data-testid="resident-agenda-title-input"
              className={inputClassName}
              type="text"
              placeholder="Dar pastilla, clase de yoga, turno medico..."
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
            Observaciones (opcional)
          </span>
          <textarea
            data-testid="resident-agenda-description-input"
            className={`${inputClassName} min-h-[80px] py-3`}
            value={formState.description}
            onChange={(event) => {
              setFormState((current) => ({
                ...current,
                description: event.target.value,
              }));
            }}
          />
        </label>

        {formState.isRecurring && (
          <div className="mt-[14px] grid gap-[14px] min-[980px]:grid-cols-[200px_minmax(0,1fr)_160px]">
            <label className="grid gap-2.5">
              <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                Tipo
              </span>
              <SelectField
                name="agenda.recurrenceType"
                testId="resident-agenda-recurrence-type"
                value={formState.recurrenceType}
                options={RECURRENCE_OPTIONS}
                onChange={(next) =>
                  setFormState((current) => ({
                    ...current,
                    recurrenceType: next as ResidentAgendaRecurrenceType,
                  }))
                }
              />
            </label>
            {formState.recurrenceType === 'weekly' ? (
              <div className="grid gap-2.5">
                <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                  Dias
                </span>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAY_LABELS.map((day) => {
                    const isActive = formState.daysOfWeek.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDayOfWeek(day.value)}
                        className={`min-h-[36px] min-w-[48px] rounded-full px-3 text-[0.86rem] font-semibold transition ${
                          isActive
                            ? 'bg-brand-primary text-white shadow-brand'
                            : 'border border-[rgba(47,79,79,0.16)] bg-white text-brand-text-secondary'
                        }`}
                      >
                        {day.short}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div />
            )}
            <label className="grid gap-2.5">
              <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                Hasta (opcional)
              </span>
              <input
                className={inputClassName}
                type="text"
                inputMode="numeric"
                maxLength={10}
                placeholder="DD/MM/YYYY"
                value={formState.endsOn}
                onChange={(event) => {
                  setFormState((current) => ({
                    ...current,
                    endsOn: formatAgendaDateInput(event.target.value),
                  }));
                }}
              />
            </label>
          </div>
        )}
      </article>

      {/* Lista de ocurrencias */}
      <div className="grid gap-3">
        {occurrencesList.length === 0 ? (
          <article className="rounded-[24px] border border-dashed border-[rgba(0,102,132,0.22)] bg-white/70 px-5 py-5 text-brand-text-secondary">
            No hay tareas agendadas para hoy.
          </article>
        ) : (
          occurrencesList.map((occurrence) => (
            <OccurrenceCard
              key={`${occurrence.sourceType}:${occurrence.sourceId}:${occurrence.occurrenceDate ?? 'one'}`}
              occurrence={occurrence}
              isSaving={isSavingEvent}
              activeMutationId={activeMutationId}
              onEventUpdate={onEventUpdate}
              onEventDelete={onEventDelete}
              onSeriesUpdate={onSeriesUpdate}
              onSeriesDelete={onSeriesDelete}
              onOccurrenceSkip={onOccurrenceSkip}
              onOccurrenceOverride={onOccurrenceOverride}
            />
          ))
        )}
      </div>
    </section>
  );
}

interface OccurrenceCardProps {
  occurrence: ResidentAgendaOccurrence;
  isSaving: boolean;
  activeMutationId: string | null;
  onEventUpdate: (
    eventId: string,
    input: ResidentAgendaEventUpdateInput,
  ) => Promise<unknown>;
  onEventDelete: (eventId: string) => Promise<boolean>;
  onSeriesUpdate: (
    seriesId: string,
    input: ResidentAgendaSeriesUpdateInput,
  ) => Promise<unknown>;
  onSeriesDelete: (seriesId: string) => Promise<boolean>;
  onOccurrenceSkip: (
    seriesId: string,
    occurrenceDate: string,
  ) => Promise<boolean>;
  onOccurrenceOverride: (
    seriesId: string,
    occurrenceDate: string,
    input: ResidentAgendaOccurrenceOverrideInput,
  ) => Promise<boolean>;
}

type CardMode = 'view' | 'choose-delete' | 'edit-one' | 'edit-series';

function OccurrenceCard(props: OccurrenceCardProps) {
  const { occurrence } = props;
  const [mode, setMode] = useState<CardMode>('view');
  const isSeries = occurrence.sourceType === 'series';
  const recurrenceBadge = isSeries
    ? formatAgendaRecurrenceBadge(occurrence.recurrence, occurrence.recurrence?.startsOn)
    : null;

  const busyKey = isSeries
    ? `occurrence:${occurrence.sourceId}:${occurrence.occurrenceDate}`
    : `event:${occurrence.sourceId}`;
  const seriesBusyKey = `series:${occurrence.sourceId}`;
  const isBusy =
    props.isSaving &&
    (props.activeMutationId === busyKey ||
      props.activeMutationId === seriesBusyKey);

  if (mode === 'edit-one' && isSeries) {
    return (
      <EditOccurrenceForm
        occurrence={occurrence}
        scope="one"
        isBusy={isBusy}
        onCancel={() => setMode('view')}
        onSave={async (input) => {
          const ok = await props.onOccurrenceOverride(
            occurrence.sourceId,
            occurrence.occurrenceDate as string,
            input,
          );
          if (ok) setMode('view');
        }}
      />
    );
  }

  if (mode === 'edit-series' && isSeries && occurrence.recurrence) {
    return (
      <EditSeriesForm
        occurrence={occurrence}
        isBusy={isBusy}
        onCancel={() => setMode('view')}
        onSave={async (input) => {
          const result = await props.onSeriesUpdate(occurrence.sourceId, input);
          if (result) setMode('view');
        }}
      />
    );
  }

  if (mode === 'edit-one' && !isSeries) {
    // Edición de evento one-off: reusamos el form inline
    return (
      <EditEventForm
        occurrence={occurrence}
        isBusy={isBusy}
        onCancel={() => setMode('view')}
        onSave={async (input) => {
          const result = await props.onEventUpdate(occurrence.sourceId, input);
          if (result) setMode('view');
        }}
      />
    );
  }

  return (
    <article
      data-testid={`resident-agenda-occurrence-${occurrence.sourceId}`}
      className="rounded-[24px] border border-[rgba(0,102,132,0.08)] bg-white/85 p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-brand-primary/10 px-3 py-1 text-[0.74rem] font-semibold uppercase tracking-[0.14em] text-brand-primary">
              {formatAgendaTime(occurrence.scheduledAt)}
            </span>
            {recurrenceBadge && (
              <span className="rounded-full bg-brand-primary/6 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-brand-text-secondary">
                {recurrenceBadge}
              </span>
            )}
            {occurrence.isOverride && (
              <span className="rounded-full bg-[rgba(212,140,18,0.16)] px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[rgb(150,90,10)]">
                editada solo hoy
              </span>
            )}
          </div>
          <strong className="text-[1.05rem] text-brand-text">
            {occurrence.title}
          </strong>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isSeries && (
            <>
              <button
                type="button"
                className={secondaryButtonClassName}
                disabled={isBusy}
                onClick={() => setMode('edit-one')}
              >
                Editar
              </button>
              <button
                type="button"
                className={secondaryButtonClassName}
                disabled={isBusy}
                onClick={() => {
                  void props.onEventDelete(occurrence.sourceId);
                }}
              >
                {isBusy ? 'Procesando...' : 'Eliminar'}
              </button>
            </>
          )}
          {isSeries && mode === 'view' && (
            <>
              <button
                type="button"
                className={secondaryButtonClassName}
                disabled={isBusy}
                onClick={() => setMode('edit-one')}
              >
                Editar solo hoy
              </button>
              <button
                type="button"
                className={secondaryButtonClassName}
                disabled={isBusy}
                onClick={() => setMode('edit-series')}
              >
                Editar serie
              </button>
              <button
                type="button"
                className={secondaryButtonClassName}
                disabled={isBusy}
                onClick={() => setMode('choose-delete')}
              >
                Eliminar
              </button>
            </>
          )}
          {isSeries && mode === 'choose-delete' && (
            <>
              <button
                type="button"
                className={secondaryButtonClassName}
                disabled={isBusy}
                onClick={async () => {
                  const ok = await props.onOccurrenceSkip(
                    occurrence.sourceId,
                    occurrence.occurrenceDate as string,
                  );
                  if (ok) setMode('view');
                }}
              >
                Solo hoy
              </button>
              <button
                type="button"
                className={secondaryButtonClassName}
                disabled={isBusy}
                onClick={async () => {
                  const ok = await props.onSeriesDelete(occurrence.sourceId);
                  if (ok) setMode('view');
                }}
              >
                Toda la serie
              </button>
              <button
                type="button"
                className={secondaryButtonClassName}
                disabled={isBusy}
                onClick={() => setMode('view')}
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>

      {occurrence.description && (
        <p className="mt-3 leading-[1.65] text-brand-text-secondary">
          {occurrence.description}
        </p>
      )}
      <div className="mt-3 grid gap-0.5 text-[0.86rem] text-brand-text-muted">
        <span>Agendado por {occurrence.audit.createdBy}</span>
        {occurrence.audit.updatedAt !== occurrence.audit.createdAt &&
          occurrence.audit.updatedBy &&
          occurrence.audit.updatedBy !== occurrence.audit.createdBy && (
            <span className="text-[0.78rem]">
              Editado por {occurrence.audit.updatedBy}
            </span>
          )}
      </div>
    </article>
  );
}

// ---------- formularios inline ----------

interface EditEventFormProps {
  occurrence: ResidentAgendaOccurrence;
  isBusy: boolean;
  onCancel: () => void;
  onSave: (input: ResidentAgendaEventUpdateInput) => Promise<void>;
}

function EditEventForm({ occurrence, isBusy, onCancel, onSave }: EditEventFormProps) {
  const initialDate = new Date(occurrence.scheduledAt);
  const dd = String(initialDate.getDate()).padStart(2, '0');
  const mm = String(initialDate.getMonth() + 1).padStart(2, '0');
  const yyyy = String(initialDate.getFullYear());
  const hh = String(initialDate.getHours()).padStart(2, '0');
  const mi = String(initialDate.getMinutes()).padStart(2, '0');
  const [title, setTitle] = useState(occurrence.title);
  const [description, setDescription] = useState(occurrence.description ?? '');
  const [date, setDate] = useState(`${dd}/${mm}/${yyyy}`);
  const [time, setTime] = useState(`${hh}:${mi}`);
  const [localError, setLocalError] = useState<string | null>(null);

  async function submit(): Promise<void> {
    if (title.trim().length === 0) {
      setLocalError('El titulo es obligatorio.');
      return;
    }
    const iso = combineAgendaDateTime(date, time);
    if (!iso) {
      setLocalError('Fecha/hora invalida.');
      return;
    }
    if (!isAgendaDateTimeInFuture(date, time)) {
      setLocalError('La fecha y hora debe estar en el futuro.');
      return;
    }
    setLocalError(null);
    await onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      scheduledAt: iso,
    });
  }

  return (
    <article className="rounded-[24px] border border-[rgba(0,102,132,0.18)] bg-white/95 p-5">
      {localError && (
        <div className="mb-3 rounded-[14px] border border-[rgba(168,43,17,0.16)] bg-[rgba(168,43,17,0.08)] px-3 py-2 text-[0.9rem] text-[rgb(130,44,25)]">
          {localError}
        </div>
      )}
      <div className="grid gap-3 min-[980px]:grid-cols-[160px_120px_minmax(0,1fr)]">
        <input
          className={inputClassName}
          value={date}
          onChange={(e) => setDate(formatAgendaDateInput(e.target.value))}
        />
        <input
          className={inputClassName}
          value={time}
          onChange={(e) => setTime(formatAgendaTimeInput(e.target.value))}
        />
        <input
          className={inputClassName}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <textarea
        className={`${inputClassName} mt-3 min-h-[72px] py-3`}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button className={secondaryButtonClassName} type="button" disabled={isBusy} onClick={onCancel}>
          Cancelar
        </button>
        <button className={primaryButtonClassName} type="button" disabled={isBusy} onClick={() => void submit()}>
          {isBusy ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </article>
  );
}

interface EditOccurrenceFormProps {
  occurrence: ResidentAgendaOccurrence;
  scope: 'one';
  isBusy: boolean;
  onCancel: () => void;
  onSave: (input: ResidentAgendaOccurrenceOverrideInput) => Promise<void>;
}

function EditOccurrenceForm({ occurrence, isBusy, onCancel, onSave }: EditOccurrenceFormProps) {
  const [title, setTitle] = useState(occurrence.title);
  const [description, setDescription] = useState(occurrence.description ?? '');
  const scheduled = new Date(occurrence.scheduledAt);
  const [time, setTime] = useState(
    `${String(scheduled.getHours()).padStart(2, '0')}:${String(scheduled.getMinutes()).padStart(2, '0')}`,
  );
  const [localError, setLocalError] = useState<string | null>(null);

  async function submit(): Promise<void> {
    if (title.trim().length === 0) {
      setLocalError('El titulo es obligatorio.');
      return;
    }
    const occurrenceDate = occurrence.occurrenceDate;
    if (!occurrenceDate) return;
    const iso = combineAgendaDateTime(ymdToAgendaInputDate(occurrenceDate), time);
    if (!iso) {
      setLocalError('Hora invalida.');
      return;
    }
    setLocalError(null);
    await onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      overrideScheduledAt: iso,
    });
  }

  return (
    <article className="rounded-[24px] border border-[rgba(212,140,18,0.4)] bg-[rgba(212,140,18,0.05)] p-5">
      <div className="mb-2 text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-[rgb(150,90,10)]">
        Editando solo la ocurrencia de hoy
      </div>
      {localError && (
        <div className="mb-3 rounded-[14px] border border-[rgba(168,43,17,0.16)] bg-[rgba(168,43,17,0.08)] px-3 py-2 text-[0.9rem] text-[rgb(130,44,25)]">
          {localError}
        </div>
      )}
      <div className="grid gap-3 min-[980px]:grid-cols-[120px_minmax(0,1fr)]">
        <input
          className={inputClassName}
          value={time}
          onChange={(e) => setTime(formatAgendaTimeInput(e.target.value))}
        />
        <input
          className={inputClassName}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <textarea
        className={`${inputClassName} mt-3 min-h-[72px] py-3`}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button className={secondaryButtonClassName} type="button" disabled={isBusy} onClick={onCancel}>
          Cancelar
        </button>
        <button className={primaryButtonClassName} type="button" disabled={isBusy} onClick={() => void submit()}>
          {isBusy ? 'Guardando...' : 'Guardar solo hoy'}
        </button>
      </div>
    </article>
  );
}

interface EditSeriesFormProps {
  occurrence: ResidentAgendaOccurrence;
  isBusy: boolean;
  onCancel: () => void;
  onSave: (input: ResidentAgendaSeriesUpdateInput) => Promise<void>;
}

function EditSeriesForm({ occurrence, isBusy, onCancel, onSave }: EditSeriesFormProps) {
  const rec = occurrence.recurrence!;
  const [title, setTitle] = useState(occurrence.title);
  const [description, setDescription] = useState(occurrence.description ?? '');
  const [recurrenceType, setRecurrenceType] = useState<ResidentAgendaRecurrenceType>(
    rec.type,
  );
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(rec.daysOfWeek);
  const [time, setTime] = useState(rec.timeOfDay);
  const [startsOn, setStartsOn] = useState(ymdToAgendaInputDate(rec.startsOn));
  const [endsOn, setEndsOn] = useState(ymdToAgendaInputDate(rec.endsOn));
  const [localError, setLocalError] = useState<string | null>(null);

  function toggleDay(day: number): void {
    setDaysOfWeek((current) =>
      current.includes(day)
        ? current.filter((d) => d !== day)
        : [...current, day].sort((a, b) => a - b),
    );
  }

  async function submit(): Promise<void> {
    if (title.trim().length === 0) {
      setLocalError('El titulo es obligatorio.');
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(time)) {
      setLocalError('Ingresa una hora HH:mm.');
      return;
    }
    const startsYmd = agendaInputDateToYmd(startsOn);
    if (!startsYmd) {
      setLocalError('Fecha de inicio invalida.');
      return;
    }
    if (recurrenceType === 'weekly' && daysOfWeek.length === 0) {
      setLocalError('Seleccioná al menos un día de la semana.');
      return;
    }
    let endsYmd: string | undefined;
    if (endsOn.length > 0) {
      const ey = agendaInputDateToYmd(endsOn);
      if (!ey) {
        setLocalError('Fecha de fin invalida.');
        return;
      }
      if (ey < startsYmd) {
        setLocalError('La fecha de fin debe ser posterior al inicio.');
        return;
      }
      endsYmd = ey;
    }
    setLocalError(null);
    await onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      recurrenceType,
      recurrenceDaysOfWeek: recurrenceType === 'weekly' ? daysOfWeek : undefined,
      timeOfDay: time,
      startsOn: startsYmd,
      endsOn: endsYmd,
    });
  }

  return (
    <article className="rounded-[24px] border border-[rgba(0,102,132,0.22)] bg-white/95 p-5">
      <div className="mb-2 text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
        Editando la serie completa (aplica desde hoy hacia adelante)
      </div>
      {localError && (
        <div className="mb-3 rounded-[14px] border border-[rgba(168,43,17,0.16)] bg-[rgba(168,43,17,0.08)] px-3 py-2 text-[0.9rem] text-[rgb(130,44,25)]">
          {localError}
        </div>
      )}
      <div className="grid gap-3 min-[980px]:grid-cols-[160px_120px_minmax(0,1fr)]">
        <input
          className={inputClassName}
          value={startsOn}
          onChange={(e) => setStartsOn(formatAgendaDateInput(e.target.value))}
        />
        <input
          className={inputClassName}
          value={time}
          onChange={(e) => setTime(formatAgendaTimeInput(e.target.value))}
        />
        <input
          className={inputClassName}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <textarea
        className={`${inputClassName} mt-3 min-h-[72px] py-3`}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="mt-3 grid gap-3 min-[980px]:grid-cols-[200px_minmax(0,1fr)_160px]">
        <label className="grid gap-2">
          <span className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
            Tipo
          </span>
          <SelectField
            name="agenda.editSeriesType"
            value={recurrenceType}
            options={RECURRENCE_OPTIONS}
            onChange={(next) => setRecurrenceType(next as ResidentAgendaRecurrenceType)}
          />
        </label>
        {recurrenceType === 'weekly' ? (
          <div className="grid gap-2">
            <span className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
              Dias
            </span>
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_LABELS.map((day) => {
                const isActive = daysOfWeek.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`min-h-[36px] min-w-[48px] rounded-full px-3 text-[0.86rem] font-semibold transition ${
                      isActive
                        ? 'bg-brand-primary text-white shadow-brand'
                        : 'border border-[rgba(47,79,79,0.16)] bg-white text-brand-text-secondary'
                    }`}
                  >
                    {day.short}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div />
        )}
        <label className="grid gap-2">
          <span className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
            Hasta (opcional)
          </span>
          <input
            className={inputClassName}
            value={endsOn}
            onChange={(e) => setEndsOn(formatAgendaDateInput(e.target.value))}
          />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button className={secondaryButtonClassName} type="button" disabled={isBusy} onClick={onCancel}>
          Cancelar
        </button>
        <button className={primaryButtonClassName} type="button" disabled={isBusy} onClick={() => void submit()}>
          {isBusy ? 'Guardando...' : 'Guardar serie'}
        </button>
      </div>
    </article>
  );
}
