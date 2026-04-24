import { useCallback, useEffect, useState } from 'react';

import type {
  ResidentObservationNote,
  ResidentObservationNoteCreateInput,
  ResidentObservationNoteCreateResponse,
} from '@gentrix/shared-types';

import {
  getApiErrorMessage,
  unwrapEnvelope,
} from '../../../shared/lib/api-envelope';
import { useAuthSession } from '../../auth/hooks/use-auth-session';
import * as residentsService from '../services/residents-service';

interface UseResidentObservationsOptions {
  /**
   * Callback opcional disparado cuando una observación creada con
   * `putUnderObservation=true` resulta en un cambio efectivo de `careStatus`
   * del residente. Permite al caller refetchear el detail para refrescar el
   * badge "En observación".
   */
  onCareStatusChanged?: () => void;
}

/**
 * Orquesta el listado y las mutaciones de observaciones simples del residente.
 * Lista todas las observaciones no borradas (el panel pagina en render).
 */
export function useResidentObservations(
  residentId: string | undefined,
  options: UseResidentObservationsOptions = {},
) {
  const { logout, status, token } = useAuthSession();
  const [notes, setNotes] = useState<ResidentObservationNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // 'create' | `delete:${id}`
  const [activeMutationId, setActiveMutationId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeTone, setNoticeTone] = useState<'success' | 'error'>('success');

  const load = useCallback(async (): Promise<void> => {
    if (!residentId || !token) {
      setNotes([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const payload =
        await residentsService.getResidentObservationNotes(residentId);
      setNotes(unwrapEnvelope(payload));
    } catch (caught) {
      const message = getApiErrorMessage(
        caught,
        'No se pudo cargar las observaciones del residente.',
      );
      if (message === 'Unauthorized.') {
        await logout();
        return;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [logout, residentId, token]);

  useEffect(() => {
    if (status !== 'authenticated' || !token) {
      setNotes([]);
      setIsLoading(true);
      return;
    }
    void load();
  }, [load, status, token]);

  const handleCreate = useCallback(
    async (
      input: ResidentObservationNoteCreateInput,
    ): Promise<ResidentObservationNoteCreateResponse | null> => {
      if (!residentId || !token) return null;
      setIsSaving(true);
      setActiveMutationId('create');
      setNotice(null);
      try {
        const payload = await residentsService.createResidentObservationNote(
          residentId,
          input,
        );
        const result = unwrapEnvelope(payload);
        await load();
        setNoticeTone('success');
        if (result.careStatusChanged) {
          setNotice(
            'Observación registrada y residente puesto en observacion.',
          );
          options.onCareStatusChanged?.();
        } else {
          setNotice('Observación registrada.');
        }
        return result;
      } catch (caught) {
        const message = getApiErrorMessage(
          caught,
          'No se pudo guardar la observacion.',
        );
        if (message === 'Unauthorized.') {
          await logout();
          return null;
        }
        setNoticeTone('error');
        setNotice(message);
        return null;
      } finally {
        setIsSaving(false);
        setActiveMutationId(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [residentId, token, load],
  );

  const handleDelete = useCallback(
    async (noteId: string): Promise<boolean> => {
      if (!residentId || !token) return false;
      setIsSaving(true);
      setActiveMutationId(`delete:${noteId}`);
      setNotice(null);
      try {
        await residentsService.deleteResidentObservationNote(
          residentId,
          noteId,
        );
        await load();
        setNoticeTone('success');
        setNotice('Observación eliminada.');
        return true;
      } catch (caught) {
        const message = getApiErrorMessage(
          caught,
          'No se pudo eliminar la observacion.',
        );
        if (message === 'Unauthorized.') {
          await logout();
          return false;
        }
        setNoticeTone('error');
        setNotice(message);
        return false;
      } finally {
        setIsSaving(false);
        setActiveMutationId(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [residentId, token, load],
  );

  return {
    notes,
    isLoading,
    error,
    isSaving,
    activeMutationId,
    notice,
    noticeTone,
    reload: load,
    handleCreate,
    handleDelete,
  };
}
