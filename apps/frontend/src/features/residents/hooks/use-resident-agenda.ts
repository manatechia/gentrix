import { useCallback, useEffect, useState } from 'react';

import type {
  ResidentAgendaEvent,
  ResidentAgendaEventCreateInput,
  ResidentAgendaEventUpdateInput,
} from '@gentrix/shared-types';

import {
  getApiErrorMessage,
  unwrapEnvelope,
} from '../../../shared/lib/api-envelope';
import { useAuthSession } from '../../auth/hooks/use-auth-session';
import * as residentsService from '../services/residents-service';

/**
 * Estado y mutaciones de la agenda del residente (próximos eventos).
 *
 * Mantiene la lista filtrada (sólo futuros) y ordenada ascendente. El backend
 * ya garantiza ambos, pero re-aplicamos del lado cliente para mantener
 * consistencia después de mutaciones optimistas.
 */
export function useResidentAgenda(residentId: string | undefined) {
  const { logout, status, token } = useAuthSession();
  const [events, setEvents] = useState<ResidentAgendaEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // 'create' durante la creación, el eventId durante edición/borrado. null en reposo.
  const [activeMutationId, setActiveMutationId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeTone, setNoticeTone] = useState<'success' | 'error'>('success');

  const load = useCallback(async (): Promise<void> => {
    if (!residentId || !token) {
      setEvents([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const payload = await residentsService.getResidentAgendaEvents(residentId);
      setEvents(sortUpcoming(unwrapEnvelope(payload)));
    } catch (caught) {
      const message = getApiErrorMessage(
        caught,
        'No pude cargar la agenda del residente.',
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
      setEvents([]);
      setIsLoading(true);
      return;
    }
    void load();
  }, [load, status, token]);

  const create = useCallback(
    async (
      input: ResidentAgendaEventCreateInput,
    ): Promise<ResidentAgendaEvent | null> => {
      if (!residentId || !token) {
        return null;
      }
      setIsSaving(true);
      setActiveMutationId('create');
      setNotice(null);
      try {
        const payload = await residentsService.createResidentAgendaEvent(
          residentId,
          input,
        );
        const created = unwrapEnvelope(payload);
        setEvents((current) => sortUpcoming([...current, created]));
        setNoticeTone('success');
        setNotice('Evento agendado correctamente.');
        return created;
      } catch (caught) {
        const message = getApiErrorMessage(
          caught,
          'No pude guardar el evento de agenda.',
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
    [logout, residentId, token],
  );

  const update = useCallback(
    async (
      eventId: string,
      input: ResidentAgendaEventUpdateInput,
    ): Promise<ResidentAgendaEvent | null> => {
      if (!residentId || !token) {
        return null;
      }
      setIsSaving(true);
      setActiveMutationId(eventId);
      setNotice(null);
      try {
        const payload = await residentsService.updateResidentAgendaEvent(
          residentId,
          eventId,
          input,
        );
        const updated = unwrapEnvelope(payload);
        setEvents((current) =>
          sortUpcoming(
            current.map((event) => (event.id === updated.id ? updated : event)),
          ),
        );
        setNoticeTone('success');
        setNotice('Evento actualizado correctamente.');
        return updated;
      } catch (caught) {
        const message = getApiErrorMessage(
          caught,
          'No pude actualizar el evento de agenda.',
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
    [logout, residentId, token],
  );

  const remove = useCallback(
    async (eventId: string): Promise<boolean> => {
      if (!residentId || !token) {
        return false;
      }
      setIsSaving(true);
      setActiveMutationId(eventId);
      setNotice(null);
      try {
        await residentsService.deleteResidentAgendaEvent(residentId, eventId);
        setEvents((current) => current.filter((event) => event.id !== eventId));
        setNoticeTone('success');
        setNotice('Evento eliminado.');
        return true;
      } catch (caught) {
        const message = getApiErrorMessage(
          caught,
          'No pude eliminar el evento de agenda.',
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
    [logout, residentId, token],
  );

  return {
    events,
    isLoading,
    error,
    isSaving,
    activeMutationId,
    notice,
    noticeTone,
    reload: load,
    handleCreate: create,
    handleUpdate: update,
    handleDelete: remove,
  };
}

function sortUpcoming(events: ResidentAgendaEvent[]): ResidentAgendaEvent[] {
  const now = Date.now();
  return [...events]
    .filter((event) => new Date(event.scheduledAt).getTime() >= now)
    .sort(
      (left, right) =>
        new Date(left.scheduledAt).getTime() -
        new Date(right.scheduledAt).getTime(),
    );
}
