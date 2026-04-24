import { useCallback, useEffect, useState } from 'react';

import type {
  MedicationExecutionResult,
  ResidentShiftDoses,
} from '@gentrix/shared-types';

import {
  getApiErrorMessage,
  unwrapEnvelope,
} from '../../../shared/lib/api-envelope';
import { useAuthSession } from '../../auth/hooks/use-auth-session';
import * as medicationsService from '../services/medications-service';

/**
 * Lista las dosis del turno actual del residente y orquesta el registro de
 * administración/omisión/rechazo. `activeMutationId` es `record:${doseId}`
 * para permitir al panel mostrar el spinner sólo en la fila en curso.
 */
export function useResidentMedicationShift(residentId: string | undefined) {
  const { logout, status, token } = useAuthSession();
  const [snapshot, setSnapshot] = useState<ResidentShiftDoses | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeMutationId, setActiveMutationId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeTone, setNoticeTone] = useState<'success' | 'error'>('success');

  const load = useCallback(async (): Promise<void> => {
    if (!residentId || !token) {
      setSnapshot(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const payload = await medicationsService.getResidentShiftDoses(residentId);
      setSnapshot(unwrapEnvelope(payload));
    } catch (caught) {
      const message = getApiErrorMessage(
        caught,
        'No se pudo cargar la medicación del turno.',
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
      setSnapshot(null);
      setIsLoading(true);
      return;
    }
    void load();
  }, [load, status, token]);

  const handleRecord = useCallback(
    async (
      medicationOrderId: string,
      doseId: string,
      scheduledFor: string,
      result: MedicationExecutionResult,
    ): Promise<boolean> => {
      if (!residentId || !token) return false;
      setIsSaving(true);
      setActiveMutationId(`record:${doseId}`);
      setNotice(null);
      try {
        // `occurredAt` registra el momento real del registro (ahora). El match
        // con la dosis programada lo hace el backend por proximidad temporal,
        // no por envío explícito de `scheduledFor` — respeta el contrato actual
        // del DTO de ejecución.
        void scheduledFor;
        await medicationsService.createMedicationExecution(medicationOrderId, {
          occurredAt: new Date().toISOString(),
          result,
        });
        await load();
        setNoticeTone('success');
        setNotice(
          result === 'administered'
            ? 'Dosis registrada como administrada.'
            : result === 'omitted'
              ? 'Dosis registrada como omitida.'
              : 'Dosis registrada como rechazada.',
        );
        return true;
      } catch (caught) {
        const message = getApiErrorMessage(
          caught,
          'No se pudo registrar la dosis.',
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
    snapshot,
    isLoading,
    error,
    isSaving,
    activeMutationId,
    notice,
    noticeTone,
    reload: load,
    handleRecord,
  };
}
