import { useState } from 'react';

import type {
  ResidentAgendaEvent,
  ResidentAgendaEventCreateInput,
  ResidentAgendaEventUpdateInput,
} from '@gentrix/shared-types';

import {
  combineAgendaDateTime,
  formatAgendaDateInput,
  formatAgendaDateTime,
  formatAgendaTimeInput,
  isAgendaDateTimeInFuture,
  splitAgendaScheduledAt,
} from '../lib/resident-agenda-utils';
import {
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  surfaceCardClassName,
} from '../../../shared/ui/class-names';

interface ResidentAgendaPanelProps {
  events: ResidentAgendaEvent[];
  isSavingEvent: boolean;
  activeMutationId: string | null;
  notice: string | null;
  noticeTone: 'success' | 'error';
  onCreate: (
    input: ResidentAgendaEventCreateInput,
  ) => Promise<ResidentAgendaEvent | null>;
  onUpdate: (
    eventId: string,
    input: ResidentAgendaEventUpdateInput,
  ) => Promise<ResidentAgendaEvent | null>;
  onDelete: (eventId: string) => Promise<boolean>;
}

interface AgendaFormState {
  title: string;
  description: string;
  date: string;
  time: string;
}

function createInitialFormState(): AgendaFormState {
  return { title: '', description: '', date: '', time: '' };
}

function validateForm(state: AgendaFormState): string | null {
  if (state.title.trim().length === 0) {
    return 'El titulo del evento es obligatorio.';
  }
  const iso = combineAgendaDateTime(state.date, state.time);
  if (!iso) {
    return 'Ingresa fecha DD/MM/YYYY y hora HH:mm validas.';
  }
  if (!isAgendaDateTimeInFuture(state.date, state.time)) {
    return 'La fecha y hora del evento debe estar en el futuro.';
  }
  return null;
}

/**
 * Panel "Próximos eventos" en la ficha del residente (SDD RF-04).
 *
 * Append + edición + borrado blando. Lista sólo eventos futuros, ordenados
 * ascendentemente. No hay ejecución ni marca de "realizado": la agenda es
 * sólo apoyo operativo.
 */
export function ResidentAgendaPanel({
  events,
  isSavingEvent,
  activeMutationId,
  notice,
  noticeTone,
  onCreate,
  onUpdate,
  onDelete,
}: ResidentAgendaPanelProps) {
  const [formState, setFormState] = useState<AgendaFormState>(
    createInitialFormState,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<AgendaFormState>(
    createInitialFormState,
  );
  const [editError, setEditError] = useState<string | null>(null);

  async function handleCreate(): Promise<void> {
    const validationError = validateForm(formState);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError(null);

    const scheduledAt = combineAgendaDateTime(formState.date, formState.time);
    if (!scheduledAt) {
      return;
    }

    const description = formState.description.trim();
    const created = await onCreate({
      title: formState.title.trim(),
      description: description.length > 0 ? description : undefined,
      scheduledAt,
    });

    if (created) {
      setFormState(createInitialFormState());
    }
  }

  function startEditing(event: ResidentAgendaEvent): void {
    const { date, time } = splitAgendaScheduledAt(event.scheduledAt);
    setEditingId(event.id);
    setEditState({
      title: event.title,
      description: event.description ?? '',
      date,
      time,
    });
    setEditError(null);
  }

  function cancelEditing(): void {
    setEditingId(null);
    setEditState(createInitialFormState());
    setEditError(null);
  }

  async function saveEdit(eventId: string): Promise<void> {
    const validationError = validateForm(editState);
    if (validationError) {
      setEditError(validationError);
      return;
    }
    setEditError(null);

    const scheduledAt = combineAgendaDateTime(editState.date, editState.time);
    if (!scheduledAt) {
      return;
    }

    const description = editState.description.trim();
    const updated = await onUpdate(eventId, {
      title: editState.title.trim(),
      description: description.length > 0 ? description : undefined,
      scheduledAt,
    });

    if (updated) {
      cancelEditing();
    }
  }

  return (
    <section
      className={`${surfaceCardClassName} grid gap-5`}
      data-testid="resident-agenda-panel"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1.5">
          <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
            Proximos eventos
          </span>
          <p className="max-w-[68ch] leading-[1.65] text-brand-text-secondary">
            Agenda de actividades futuras del residente: medicacion, turnos,
            clases o recordatorios. Solo lista eventos por venir.
          </p>
        </div>
        <span className="rounded-full bg-brand-primary/10 px-3 py-2 text-[0.82rem] font-semibold text-brand-primary">
          {events.length} proximos
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

      <article className="rounded-[24px] border border-[rgba(0,102,132,0.08)] bg-brand-neutral/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
            Agregar evento
          </span>
          <button
            data-testid="resident-agenda-submit-button"
            className={primaryButtonClassName}
            type="button"
            disabled={isSavingEvent && activeMutationId === 'create'}
            onClick={() => {
              void handleCreate();
            }}
          >
            {isSavingEvent && activeMutationId === 'create'
              ? 'Guardando...'
              : 'Guardar evento'}
          </button>
        </div>

        <div className="mt-4 grid gap-[14px] min-[980px]:grid-cols-[160px_120px_minmax(0,1fr)]">
          <label className="grid gap-2.5">
            <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
              Fecha
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
              placeholder="Dar medicacion, clase de yoga, turno medico..."
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
            className={`${inputClassName} min-h-[88px] py-3`}
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
            No hay eventos futuros agendados para este residente.
          </article>
        ) : (
          events.map((event) => {
            const isEditing = editingId === event.id;
            const isBusy =
              isSavingEvent && activeMutationId === event.id;

            if (isEditing) {
              return (
                <article
                  key={event.id}
                  data-testid={`resident-agenda-event-${event.id}-editing`}
                  className="rounded-[24px] border border-[rgba(0,102,132,0.18)] bg-white/95 p-5"
                >
                  {editError && (
                    <div className="mb-3 rounded-[14px] border border-[rgba(168,43,17,0.16)] bg-[rgba(168,43,17,0.08)] px-3 py-2 text-[0.9rem] text-[rgb(130,44,25)]">
                      {editError}
                    </div>
                  )}
                  <div className="grid gap-3 min-[980px]:grid-cols-[160px_120px_minmax(0,1fr)]">
                    <input
                      className={inputClassName}
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      value={editState.date}
                      onChange={(inputEvent) => {
                        setEditState((current) => ({
                          ...current,
                          date: formatAgendaDateInput(inputEvent.target.value),
                        }));
                      }}
                    />
                    <input
                      className={inputClassName}
                      type="text"
                      inputMode="numeric"
                      maxLength={5}
                      value={editState.time}
                      onChange={(inputEvent) => {
                        setEditState((current) => ({
                          ...current,
                          time: formatAgendaTimeInput(inputEvent.target.value),
                        }));
                      }}
                    />
                    <input
                      className={inputClassName}
                      type="text"
                      value={editState.title}
                      onChange={(inputEvent) => {
                        setEditState((current) => ({
                          ...current,
                          title: inputEvent.target.value,
                        }));
                      }}
                    />
                  </div>
                  <textarea
                    className={`${inputClassName} mt-3 min-h-[88px] py-3`}
                    value={editState.description}
                    onChange={(inputEvent) => {
                      setEditState((current) => ({
                        ...current,
                        description: inputEvent.target.value,
                      }));
                    }}
                  />
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      className={secondaryButtonClassName}
                      disabled={isBusy}
                      onClick={cancelEditing}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className={primaryButtonClassName}
                      disabled={isBusy}
                      onClick={() => {
                        void saveEdit(event.id);
                      }}
                    >
                      {isBusy ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                </article>
              );
            }

            return (
              <article
                key={event.id}
                data-testid={`resident-agenda-event-${event.id}`}
                className="rounded-[24px] border border-[rgba(0,102,132,0.08)] bg-white/85 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="grid gap-2">
                    <span className="inline-flex w-fit rounded-full bg-brand-primary/10 px-3 py-1 text-[0.74rem] font-semibold uppercase tracking-[0.14em] text-brand-primary">
                      {formatAgendaDateTime(event.scheduledAt)}
                    </span>
                    <strong className="text-[1.05rem] text-brand-text">
                      {event.title}
                    </strong>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={secondaryButtonClassName}
                      data-testid={`resident-agenda-edit-${event.id}`}
                      disabled={isBusy}
                      onClick={() => startEditing(event)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className={secondaryButtonClassName}
                      data-testid={`resident-agenda-delete-${event.id}`}
                      disabled={isBusy}
                      onClick={() => {
                        void onDelete(event.id);
                      }}
                    >
                      {isBusy ? 'Procesando...' : 'Eliminar'}
                    </button>
                  </div>
                </div>

                {event.description && (
                  <p className="mt-3 leading-[1.65] text-brand-text-secondary">
                    {event.description}
                  </p>
                )}

                <div className="mt-3 text-[0.86rem] text-brand-text-muted">
                  Agendado por {event.audit.createdBy}
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
