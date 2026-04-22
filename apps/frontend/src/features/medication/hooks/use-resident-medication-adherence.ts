import { useCallback, useEffect, useState } from 'react';

import type { MedicationAdherenceSummary } from '@gentrix/shared-types';

import {
  getApiErrorMessage,
  unwrapEnvelope,
} from '../../../shared/lib/api-envelope';
import { useAuthSession } from '../../auth/hooks/use-auth-session';
import * as medicationsService from '../services/medications-service';

/**
 * Carga el resumen de adherencia de los últimos `days` días. Sin mutaciones:
 * es puramente read. El caller puede llamar `reload` tras registrar una
 * nueva ejecución para refrescar la métrica.
 */
export function useResidentMedicationAdherence(
  residentId: string | undefined,
  days = 30,
) {
  const { logout, status, token } = useAuthSession();
  const [summary, setSummary] = useState<MedicationAdherenceSummary | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    if (!residentId || !token) {
      setSummary(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const payload = await medicationsService.getResidentAdherence(
        residentId,
        days,
      );
      setSummary(unwrapEnvelope(payload));
    } catch (caught) {
      const message = getApiErrorMessage(
        caught,
        'No pude cargar la adherencia del residente.',
      );
      if (message === 'Unauthorized.') {
        await logout();
        return;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [logout, residentId, token, days]);

  useEffect(() => {
    if (status !== 'authenticated' || !token) {
      setSummary(null);
      setIsLoading(true);
      return;
    }
    void load();
  }, [load, status, token]);

  return { summary, isLoading, error, reload: load };
}
