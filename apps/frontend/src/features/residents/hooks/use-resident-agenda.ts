import { useCallback, useEffect, useState } from 'react';

import type {
  ResidentAgendaEvent,
  ResidentAgendaEventCreateInput,
  ResidentAgendaEventUpdateInput,
  ResidentAgendaOccurrence,
  ResidentAgendaOccurrenceOverrideInput,
  ResidentAgendaSeries,
  ResidentAgendaSeriesCreateInput,
  ResidentAgendaSeriesUpdateInput,
} from '@gentrix/shared-types';

import {
  getApiErrorMessage,
  unwrapEnvelope,
} from '../../../shared/lib/api-envelope';
import { useAuthSession } from '../../auth/hooks/use-auth-session';
import * as residentsService from '../services/residents-service';

/**
 * Orquesta el listado y las mutaciones de la agenda del residente.
 * La lista cargada representa las ocurrencias del día (mix de eventos one-off
 * y series recurrentes expandidas). Las mutaciones cubren ambos mundos:
 * eventos aislados, series (reglas completas) y excepciones por ocurrencia.
 */
export function useResidentAgenda(residentId: string | undefined) {
  const { logout, status, token } = useAuthSession();
  const [occurrences, setOccurrences] = useState<ResidentAgendaOccurrence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // key identifies busy item:
  //   'create-event' | 'create-series' | `event:${id}` | `series:${id}` | `occurrence:${seriesId}:${date}`
  const [activeMutationId, setActiveMutationId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeTone, setNoticeTone] = useState<'success' | 'error'>('success');

  const load = useCallback(async (): Promise<void> => {
    if (!residentId || !token) {
      setOccurrences([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const payload = await residentsService.getResidentAgendaOccurrences(residentId);
      setOccurrences(unwrapEnvelope(payload));
    } catch (caught) {
      const message = getApiErrorMessage(
        caught,
        'No se pudo cargar la agenda del residente.',
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
      setOccurrences([]);
      setIsLoading(true);
      return;
    }
    void load();
  }, [load, status, token]);

  // Helper para envolver la mutación con loading/notice/reload.
  async function withMutation<T>(
    mutationId: string,
    successNotice: string,
    errorFallback: string,
    fn: () => Promise<T>,
  ): Promise<T | null> {
    if (!residentId || !token) return null;
    setIsSaving(true);
    setActiveMutationId(mutationId);
    setNotice(null);
    try {
      const result = await fn();
      await load();
      setNoticeTone('success');
      setNotice(successNotice);
      return result;
    } catch (caught) {
      const message = getApiErrorMessage(caught, errorFallback);
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
  }

  const createEvent = useCallback(
    async (
      input: ResidentAgendaEventCreateInput,
    ): Promise<ResidentAgendaEvent | null> => {
      return withMutation(
        'create-event',
        'Evento agendado correctamente.',
        'No se pudo guardar el evento.',
        async () => {
          const payload = await residentsService.createResidentAgendaEvent(
            residentId as string,
            input,
          );
          return unwrapEnvelope(payload);
        },
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [residentId, token],
  );

  const updateEvent = useCallback(
    async (
      eventId: string,
      input: ResidentAgendaEventUpdateInput,
    ): Promise<ResidentAgendaEvent | null> => {
      return withMutation(
        `event:${eventId}`,
        'Evento actualizado.',
        'No se pudo actualizar el evento.',
        async () => {
          const payload = await residentsService.updateResidentAgendaEvent(
            residentId as string,
            eventId,
            input,
          );
          return unwrapEnvelope(payload);
        },
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [residentId, token],
  );

  const deleteEvent = useCallback(
    async (eventId: string): Promise<boolean> => {
      const result = await withMutation(
        `event:${eventId}`,
        'Evento eliminado.',
        'No se pudo eliminar el evento.',
        async () => {
          await residentsService.deleteResidentAgendaEvent(
            residentId as string,
            eventId,
          );
          return true;
        },
      );
      return result ?? false;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [residentId, token],
  );

  const createSeries = useCallback(
    async (
      input: ResidentAgendaSeriesCreateInput,
    ): Promise<ResidentAgendaSeries | null> => {
      return withMutation(
        'create-series',
        'Serie recurrente creada.',
        'No se pudo crear la serie.',
        async () => {
          const payload = await residentsService.createResidentAgendaSeries(
            residentId as string,
            input,
          );
          return unwrapEnvelope(payload);
        },
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [residentId, token],
  );

  const updateSeries = useCallback(
    async (
      seriesId: string,
      input: ResidentAgendaSeriesUpdateInput,
    ): Promise<ResidentAgendaSeries | null> => {
      return withMutation(
        `series:${seriesId}`,
        'Serie actualizada.',
        'No se pudo actualizar la serie.',
        async () => {
          const payload = await residentsService.updateResidentAgendaSeries(
            residentId as string,
            seriesId,
            input,
          );
          return unwrapEnvelope(payload);
        },
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [residentId, token],
  );

  const deleteSeries = useCallback(
    async (seriesId: string): Promise<boolean> => {
      const result = await withMutation(
        `series:${seriesId}`,
        'Serie eliminada.',
        'No se pudo eliminar la serie.',
        async () => {
          await residentsService.deleteResidentAgendaSeries(
            residentId as string,
            seriesId,
          );
          return true;
        },
      );
      return result ?? false;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [residentId, token],
  );

  const skipOccurrence = useCallback(
    async (seriesId: string, occurrenceDate: string): Promise<boolean> => {
      const result = await withMutation(
        `occurrence:${seriesId}:${occurrenceDate}`,
        'Ocurrencia de hoy eliminada.',
        'No se pudo saltear la ocurrencia.',
        async () => {
          await residentsService.skipResidentAgendaOccurrence(
            residentId as string,
            seriesId,
            occurrenceDate,
          );
          return true;
        },
      );
      return result ?? false;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [residentId, token],
  );

  const overrideOccurrence = useCallback(
    async (
      seriesId: string,
      occurrenceDate: string,
      input: ResidentAgendaOccurrenceOverrideInput,
    ): Promise<boolean> => {
      const result = await withMutation(
        `occurrence:${seriesId}:${occurrenceDate}`,
        'Ocurrencia de hoy actualizada.',
        'No se pudo actualizar la ocurrencia.',
        async () => {
          await residentsService.overrideResidentAgendaOccurrence(
            residentId as string,
            seriesId,
            occurrenceDate,
            input,
          );
          return true;
        },
      );
      return result ?? false;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [residentId, token],
  );

  return {
    occurrences,
    isLoading,
    error,
    isSaving,
    activeMutationId,
    notice,
    noticeTone,
    reload: load,
    handleEventCreate: createEvent,
    handleEventUpdate: updateEvent,
    handleEventDelete: deleteEvent,
    handleSeriesCreate: createSeries,
    handleSeriesUpdate: updateSeries,
    handleSeriesDelete: deleteSeries,
    handleOccurrenceSkip: skipOccurrence,
    handleOccurrenceOverride: overrideOccurrence,
  };
}
