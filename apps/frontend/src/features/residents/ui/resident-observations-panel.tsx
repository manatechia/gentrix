import { useMemo, useState } from 'react';

import type {
  ResidentCareStatusChangeEvent,
  ResidentCareStatusClosureReason,
  ResidentObservationNote,
  ResidentObservationNoteCreateInput,
  ResidentObservationNoteCreateResponse,
} from '@gentrix/shared-types';

import {
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  surfaceCardClassName,
} from '../../../shared/ui/class-names';

interface ResidentObservationsPanelProps {
  notes: ResidentObservationNote[];
  /**
   * Eventos de transición de `careStatus` del residente. El panel los
   * intercala con las notas para que el cierre formal aparezca como un
   * hito visible en el timeline.
   */
  careStatusChanges: ResidentCareStatusChangeEvent[];
  /**
   * Si true, el checkbox "poner en observación" no se muestra: el residente
   * ya está en ese estado y no tiene sentido ofrecerlo al guardar.
   */
  isUnderObservation: boolean;
  isSaving: boolean;
  activeMutationId: string | null;
  notice: string | null;
  noticeTone: 'success' | 'error';
  onCreate: (
    input: ResidentObservationNoteCreateInput,
  ) => Promise<ResidentObservationNoteCreateResponse | null>;
  onDelete: (noteId: string) => Promise<boolean>;
  /**
   * Si el residente está en observación, el panel muestra un botón para
   * iniciar el cierre formal. El parent es responsable de abrir el modal
   * que pide motivo y nota — el panel solo dispara la intención.
   */
  onRequestObservationClosure?: () => void;
  isClearingObservation?: boolean;
}

const INITIAL_PREVIEW_COUNT = 5;

const dateTimeFormatter = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatDateTime(value: string): string {
  return dateTimeFormatter.format(new Date(value));
}

const closureReasonLabels: Record<ResidentCareStatusClosureReason, string> = {
  estable: 'Quedó estable',
  escalado_medico: 'Escalado a médico',
  derivado: 'Derivado',
  otro: 'Otro',
};

type TimelineItem =
  | { kind: 'note'; createdAt: string; note: ResidentObservationNote }
  | {
      kind: 'closure';
      createdAt: string;
      event: ResidentCareStatusChangeEvent;
    };

export function ResidentObservationsPanel({
  notes,
  careStatusChanges,
  isUnderObservation,
  isSaving,
  activeMutationId,
  notice,
  noticeTone,
  onCreate,
  onDelete,
  onRequestObservationClosure,
  isClearingObservation = false,
}: ResidentObservationsPanelProps) {
  const [note, setNote] = useState('');
  const [putUnderObservation, setPutUnderObservation] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const isCreating = isSaving && activeMutationId === 'create';
  const trimmedNote = note.trim();
  const canSubmit = trimmedNote.length > 0 && !isSaving;

  // Solo los cierres formales aparecen como hitos en el timeline; las
  // aperturas (normal -> en_observacion) ya quedan reflejadas por la nota
  // que las dispara.
  const closureEvents = useMemo(
    () =>
      careStatusChanges.filter(
        (event) =>
          event.fromStatus === 'en_observacion' && event.toStatus === 'normal',
      ),
    [careStatusChanges],
  );

  const timelineItems = useMemo<TimelineItem[]>(() => {
    const noteItems: TimelineItem[] = notes.map((entry) => ({
      kind: 'note',
      createdAt: entry.audit.createdAt,
      note: entry,
    }));
    const closureItems: TimelineItem[] = closureEvents.map((event) => ({
      kind: 'closure',
      createdAt: event.createdAt,
      event,
    }));
    return [...noteItems, ...closureItems].sort((left, right) =>
      left.createdAt < right.createdAt
        ? 1
        : left.createdAt > right.createdAt
          ? -1
          : 0,
    );
  }, [notes, closureEvents]);

  const visibleItems = expanded
    ? timelineItems
    : timelineItems.slice(0, INITIAL_PREVIEW_COUNT);
  const hiddenCount = Math.max(0, timelineItems.length - INITIAL_PREVIEW_COUNT);

  async function handleSubmit(): Promise<void> {
    if (!canSubmit) return;
    const result = await onCreate({
      note: trimmedNote,
      putUnderObservation:
        !isUnderObservation && putUnderObservation ? true : undefined,
    });
    if (result) {
      setNote('');
      setPutUnderObservation(false);
    }
  }

  async function handleDelete(id: string): Promise<void> {
    const ok = await onDelete(id);
    if (ok) setConfirmingId(null);
  }

  return (
    <section
      className={`${surfaceCardClassName} grid gap-5`}
      data-testid="resident-observations-panel"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-brand-primary sm:text-[0.76rem] sm:tracking-[0.16em]">
          Observaciones
        </span>
        {isUnderObservation && onRequestObservationClosure && (
          <button
            data-testid="resident-observations-clear-observation-button"
            type="button"
            className={secondaryButtonClassName}
            disabled={isClearingObservation || isSaving}
            onClick={() => onRequestObservationClosure()}
          >
            {isClearingObservation
              ? 'Actualizando...'
              : 'Cerrar observación'}
          </button>
        )}
      </header>

      {notice && (
        <div
          data-testid="resident-observations-notice"
          className={`rounded-[18px] px-4 py-3 text-[0.92rem] leading-[1.5] ${
            noticeTone === 'error'
              ? 'border border-[rgba(168,43,17,0.16)] bg-[rgba(168,43,17,0.08)] text-[rgb(130,44,25)]'
              : 'border border-[rgba(0,102,132,0.14)] bg-[rgba(0,102,132,0.08)] text-brand-secondary'
          }`}
        >
          {notice}
        </div>
      )}

      <div className="grid gap-3">
        <label className="grid gap-2">
          <span className="sr-only">Nueva observación</span>
          <textarea
            data-testid="resident-observation-note-input"
            className={`${inputClassName} min-h-[88px] resize-y py-3 leading-[1.5]`}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Ej: No comió al mediodía."
            maxLength={2000}
            disabled={isSaving}
          />
        </label>

        {!isUnderObservation && (
          <label className="flex items-center gap-2 text-[0.92rem] text-brand-text-secondary">
            <input
              data-testid="resident-observation-put-under-observation-checkbox"
              type="checkbox"
              checked={putUnderObservation}
              onChange={(event) => setPutUnderObservation(event.target.checked)}
              disabled={isSaving}
            />
            <span>Poner al residente en observación al guardar.</span>
          </label>
        )}

        <div>
          <button
            data-testid="resident-observations-submit"
            type="button"
            className={primaryButtonClassName}
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
          >
            {isCreating ? 'Registrando...' : 'Registrar observación'}
          </button>
        </div>
      </div>

      <div className="grid gap-3">
        {timelineItems.length === 0 ? (
          <p className="rounded-[20px] border border-dashed border-[rgba(0,102,132,0.2)] bg-brand-neutral/40 px-4 py-6 text-center text-brand-text-secondary">
            Sin observaciones registradas.
          </p>
        ) : (
          <ul className="grid gap-3">
            {visibleItems.map((item) => {
              if (item.kind === 'closure') {
                return (
                  <li
                    key={`closure:${item.event.id}`}
                    data-testid="resident-observation-closure-item"
                    className="grid gap-2 rounded-[22px] border border-[rgba(0,102,132,0.16)] bg-[rgba(0,102,132,0.06)] px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-brand-secondary">
                        Cierre de observación
                        {item.event.closureReason && (
                          <span className="rounded-full bg-white/80 px-2 py-0.5 text-[0.72rem] tracking-normal text-brand-secondary">
                            {closureReasonLabels[item.event.closureReason]}
                          </span>
                        )}
                      </span>
                      <span className="text-[0.78rem] text-brand-text-muted">
                        {formatDateTime(item.event.createdAt)} · {item.event.createdBy}
                      </span>
                    </div>
                    {item.event.note && (
                      <p className="whitespace-pre-wrap leading-[1.55] text-brand-text">
                        {item.event.note}
                      </p>
                    )}
                  </li>
                );
              }
              const noteEntry = item.note;
              const isDeleting =
                isSaving && activeMutationId === `delete:${noteEntry.id}`;
              const isConfirming = confirmingId === noteEntry.id;
              return (
                <li
                  key={noteEntry.id}
                  data-testid="resident-observation-item"
                  className="grid gap-2 rounded-[22px] border border-[rgba(0,102,132,0.08)] bg-white/85 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="grid gap-0.5">
                      <span className="text-[0.78rem] font-semibold text-brand-text-muted">
                        {formatDateTime(noteEntry.audit.createdAt)} · {noteEntry.audit.createdBy}
                      </span>
                      {noteEntry.audit.updatedAt !== noteEntry.audit.createdAt && (
                        <span className="text-[0.72rem] text-brand-text-muted">
                          Editado {formatDateTime(noteEntry.audit.updatedAt)}
                          {noteEntry.audit.updatedBy && noteEntry.audit.updatedBy !== noteEntry.audit.createdBy
                            ? ` · ${noteEntry.audit.updatedBy}`
                            : ''}
                        </span>
                      )}
                    </div>
                    {!isConfirming ? (
                      <button
                        data-testid="resident-observation-delete-button"
                        type="button"
                        aria-label="Eliminar observación"
                        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[0.82rem] font-medium text-[rgb(130,44,25)] transition hover:bg-[rgba(168,43,17,0.08)] disabled:opacity-60"
                        onClick={() => setConfirmingId(noteEntry.id)}
                        disabled={isSaving}
                      >
                        <svg
                          aria-hidden="true"
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18" />
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                        </svg>
                        <span>Eliminar</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-[0.82rem]">
                        <span className="text-brand-text-secondary">
                          ¿Eliminar?
                        </span>
                        <button
                          data-testid="resident-observation-confirm-delete-button"
                          type="button"
                          className="rounded-lg px-2 py-1 font-semibold text-[rgb(130,44,25)] transition hover:bg-[rgba(168,43,17,0.08)] disabled:opacity-60"
                          onClick={() => void handleDelete(noteEntry.id)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? 'Eliminando...' : 'Sí'}
                        </button>
                        <button
                          type="button"
                          className="rounded-lg px-2 py-1 text-brand-text-secondary transition hover:bg-brand-neutral disabled:opacity-60"
                          onClick={() => setConfirmingId(null)}
                          disabled={isDeleting}
                        >
                          No
                        </button>
                      </span>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap leading-[1.55] text-brand-text">
                    {noteEntry.note}
                  </p>
                </li>
              );
            })}
          </ul>
        )}

        {!expanded && hiddenCount > 0 && (
          <div>
            <button
              data-testid="resident-observations-show-more"
              type="button"
              className={secondaryButtonClassName}
              onClick={() => setExpanded(true)}
            >
              Ver más ({hiddenCount})
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
