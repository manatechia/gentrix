import { useMemo, useState } from 'react';

import type {
  ResidentObservationNoteCreateInput,
  ResidentOverview,
} from '@gentrix/shared-types';

import {
  getApiErrorMessage,
  unwrapEnvelope,
} from '../../../shared/lib/api-envelope';
import {
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from '../../../shared/ui/class-names';
import * as residentsService from '../../residents/services/residents-service';

interface QuickObservationModalProps {
  residents: ResidentOverview[];
  onClose: () => void;
  /**
   * Se dispara al guardar con éxito. El caller es responsable de mostrar
   * el notice al usuario y refrescar el snapshot si corresponde.
   */
  onSuccess: (message: string) => void;
}

export function QuickObservationModal({
  residents,
  onClose,
  onSuccess,
}: QuickObservationModalProps) {
  const [residentId, setResidentId] = useState<string>('');
  const [note, setNote] = useState('');
  const [putUnderObservation, setPutUnderObservation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedResident = useMemo(
    () => residents.find((resident) => resident.id === residentId) ?? null,
    [residents, residentId],
  );

  const isSelectedUnderObservation =
    selectedResident?.careStatus === 'en_observacion';

  const trimmedNote = note.trim();
  const canSubmit =
    !!selectedResident && trimmedNote.length > 0 && !isSaving;

  async function handleSubmit(): Promise<void> {
    if (!canSubmit || !selectedResident) return;

    setIsSaving(true);
    setError(null);

    const input: ResidentObservationNoteCreateInput = {
      note: trimmedNote,
      putUnderObservation:
        !isSelectedUnderObservation && putUnderObservation ? true : undefined,
    };

    try {
      const payload = await residentsService.createResidentObservationNote(
        selectedResident.id,
        input,
      );
      const result = unwrapEnvelope(payload);
      const baseMessage = `Observación registrada para ${selectedResident.fullName}.`;
      const message = result.careStatusChanged
        ? `${baseMessage} Residente puesto en observación.`
        : baseMessage;
      onSuccess(message);
    } catch (caught) {
      setError(
        getApiErrorMessage(caught, 'No pude guardar la observación.'),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="quick-observation-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(9,16,28,0.55)] px-4"
    >
      <div className="grid w-full max-w-[520px] gap-4 rounded-[28px] bg-white px-6 py-6 shadow-panel">
        <header className="grid gap-1">
          <h3 className="text-[1.2rem] font-bold tracking-[-0.03em] text-brand-text">
            Nueva observación
          </h3>
          <p className="text-brand-text-secondary">
            Registrá rápido algo del turno sin abrir la ficha del residente.
          </p>
        </header>

        {error && (
          <div
            data-testid="quick-observation-error"
            className="rounded-[18px] border border-[rgba(168,43,17,0.16)] bg-[rgba(168,43,17,0.08)] px-4 py-3 text-[rgb(130,44,25)]"
          >
            {error}
          </div>
        )}

        <label className="grid gap-2">
          <span className="text-[0.82rem] font-semibold text-brand-text">
            Residente
          </span>
          <select
            data-testid="quick-observation-resident-select"
            className={inputClassName}
            value={residentId}
            onChange={(event) => {
              setResidentId(event.target.value);
              setPutUnderObservation(false);
            }}
            disabled={isSaving}
          >
            <option value="">Seleccioná un residente…</option>
            {residents.map((resident) => (
              <option key={resident.id} value={resident.id}>
                {resident.fullName} — Habitación {resident.room}
                {resident.careStatus === 'en_observacion' ? ' (en obs.)' : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-[0.82rem] font-semibold text-brand-text">
            Observación
          </span>
          <textarea
            data-testid="quick-observation-note-input"
            className={`${inputClassName} min-h-[92px] resize-y py-3`}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder='Ej: "No comió al mediodía."'
            maxLength={2000}
            disabled={isSaving}
          />
        </label>

        {selectedResident && !isSelectedUnderObservation && (
          <label className="flex items-center gap-2 text-[0.92rem] text-brand-text-secondary">
            <input
              data-testid="quick-observation-put-under-observation-checkbox"
              type="checkbox"
              checked={putUnderObservation}
              onChange={(event) => setPutUnderObservation(event.target.checked)}
              disabled={isSaving}
            />
            <span>Poner al residente en observación al guardar.</span>
          </label>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button
            data-testid="quick-observation-submit"
            type="button"
            className={primaryButtonClassName}
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
          >
            {isSaving ? 'Registrando...' : 'Registrar'}
          </button>
        </div>
      </div>
    </div>
  );
}
