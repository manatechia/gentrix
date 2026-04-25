import { useState } from 'react';

import {
  RESIDENT_CARE_STATUS_CLOSURE_REASONS,
  type ResidentCareStatusClosureReason,
} from '@gentrix/shared-types';

import {
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from '../../../shared/ui/class-names';

interface ResidentObservationClosureModalProps {
  residentName: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: (
    closureReason: ResidentCareStatusClosureReason,
    note: string | undefined,
  ) => Promise<void> | void;
}

const closureReasonLabels: Record<ResidentCareStatusClosureReason, string> = {
  estable: 'Quedó estable',
  escalado_medico: 'Escalado a médico',
  derivado: 'Derivado',
  otro: 'Otro',
};

export function ResidentObservationClosureModal({
  residentName,
  isSubmitting,
  onCancel,
  onConfirm,
}: ResidentObservationClosureModalProps) {
  const [closureReason, setClosureReason] =
    useState<ResidentCareStatusClosureReason | ''>('');
  const [note, setNote] = useState('');

  const canSubmit = closureReason !== '' && !isSubmitting;
  const trimmedNote = note.trim();

  async function handleConfirm(): Promise<void> {
    if (!canSubmit) return;
    await onConfirm(
      closureReason as ResidentCareStatusClosureReason,
      trimmedNote ? trimmedNote : undefined,
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="resident-observation-closure-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(9,16,28,0.55)] px-4"
    >
      <div className="grid w-full max-w-[480px] gap-4 rounded-[28px] bg-white px-6 py-6 shadow-panel">
        <header className="grid gap-1">
          <h3 className="text-[1.2rem] font-bold tracking-[-0.03em] text-brand-text">
            Cerrar observación
          </h3>
          <p className="text-brand-text-secondary">
            ¿Por qué sale de observación {residentName}? El motivo queda
            registrado en su historial.
          </p>
        </header>

        <label className="grid gap-2">
          <span className="text-[0.82rem] font-semibold text-brand-text">
            Motivo
          </span>
          <select
            data-testid="resident-observation-closure-reason-select"
            className={inputClassName}
            value={closureReason}
            onChange={(event) =>
              setClosureReason(
                event.target.value as ResidentCareStatusClosureReason | '',
              )
            }
            disabled={isSubmitting}
          >
            <option value="">Seleccionar motivo…</option>
            {RESIDENT_CARE_STATUS_CLOSURE_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {closureReasonLabels[reason]}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-[0.82rem] font-semibold text-brand-text">
            Nota (opcional)
          </span>
          <textarea
            data-testid="resident-observation-closure-note-input"
            className={`${inputClassName} min-h-[88px] resize-y py-3 leading-[1.5]`}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Detalles del cierre, si corresponden."
            maxLength={2000}
            disabled={isSubmitting}
          />
        </label>

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            data-testid="resident-observation-closure-submit"
            type="button"
            className={primaryButtonClassName}
            onClick={() => void handleConfirm()}
            disabled={!canSubmit}
          >
            {isSubmitting ? 'Cerrando...' : 'Cerrar observación'}
          </button>
        </div>
      </div>
    </div>
  );
}
