import { useCallback, useEffect, useState } from 'react';

import type { ResidentAgendaEventWithResident } from '@gentrix/shared-types';

import {
  getApiErrorMessage,
  unwrapEnvelope,
} from '../../../shared/lib/api-envelope';
import { useAuthSession } from '../../auth/hooks/use-auth-session';
import * as residentsService from '../../residents/services/residents-service';

/**
 * Carga los próximos eventos de agenda a nivel organización para el bloque
 * "Próximas tareas" del dashboard. Aislado en su propio hook para no
 * acoplarlo al snapshot estático del dashboard, que aún no incluye agenda.
 */
export function useUpcomingAgenda(limit = 20) {
  const { logout, status, token } = useAuthSession();
  const [events, setEvents] = useState<ResidentAgendaEventWithResident[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    if (!token) {
      setEvents([]);
      return;
    }
    setError(null);
    try {
      const payload = await residentsService.getUpcomingAgendaEvents(limit);
      setEvents(unwrapEnvelope(payload));
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
  }, [limit, logout, token]);

  useEffect(() => {
    if (status !== 'authenticated' || !token) {
      setEvents([]);
      return;
    }
    void load();
  }, [load, status, token]);

  return { events, error, reload: load };
}
