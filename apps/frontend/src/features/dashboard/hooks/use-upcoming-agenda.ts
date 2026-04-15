import { useCallback, useEffect, useState } from 'react';

import type { ResidentAgendaOccurrenceWithResident } from '@gentrix/shared-types';

import {
  getApiErrorMessage,
  unwrapEnvelope,
} from '../../../shared/lib/api-envelope';
import { useAuthSession } from '../../auth/hooks/use-auth-session';
import * as residentsService from '../../residents/services/residents-service';

/**
 * Ocurrencias del día a nivel organización para el bloque "Próximas tareas"
 * del dashboard. Carga las mismas ocurrencias que ve el personal al abrir
 * la ficha de cada residente, pero agregadas.
 */
export function useUpcomingAgenda() {
  const { logout, status, token } = useAuthSession();
  const [occurrences, setOccurrences] = useState<
    ResidentAgendaOccurrenceWithResident[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    if (!token) {
      setOccurrences([]);
      return;
    }
    setError(null);
    try {
      const payload = await residentsService.getUpcomingAgendaOccurrences();
      setOccurrences(unwrapEnvelope(payload));
    } catch (caught) {
      const message = getApiErrorMessage(
        caught,
        'No pude cargar las proximas tareas.',
      );
      if (message === 'Unauthorized.') {
        await logout();
        return;
      }
      setError(message);
    }
  }, [logout, token]);

  useEffect(() => {
    if (status !== 'authenticated' || !token) {
      setOccurrences([]);
      return;
    }
    void load();
  }, [load, status, token]);

  return { occurrences, error, reload: load };
}
