import { useCallback, useEffect, useState } from 'react';

import type {
  ClinicalHistoryEvent,
  ClinicalHistoryEventCreateInput,
  ResidentCareStatus,
  ResidentDetail,
  ResidentLiveProfile,
  ResidentObservation,
  ResidentObservationCreateInput,
  ResidentObservationEntryCreateInput,
  ResidentObservationResolveInput,
} from '@gentrix/shared-types';

import { useAuthSession } from '../../auth/hooks/use-auth-session';
import {
  getApiErrorMessage,
  unwrapEnvelope,
} from '../../../shared/lib/api-envelope';
import type { DashboardScreenState } from '../../dashboard/types/dashboard-screen-state';
import * as residentsService from '../services/residents-service';

export function useResidentDetailRoute(residentId: string | undefined) {
  const { logout, status, token } = useAuthSession();
  const [screenState, setScreenState] =
    useState<DashboardScreenState>('loading');
  const [resident, setResident] = useState<ResidentDetail | null>(null);
  const [residentLiveProfile, setResidentLiveProfile] =
    useState<ResidentLiveProfile | null>(null);
  const [residentError, setResidentError] = useState<string | null>(null);
  const [clinicalHistory, setClinicalHistory] = useState<ClinicalHistoryEvent[]>(
    [],
  );
  const [observations, setObservations] = useState<ResidentObservation[]>([]);
  const [isSavingClinicalHistoryEvent, setIsSavingClinicalHistoryEvent] =
    useState(false);
  const [isSavingObservation, setIsSavingObservation] = useState(false);
  const [activeObservationMutationId, setActiveObservationMutationId] =
    useState<string | null>(null);
  const [clinicalHistoryNotice, setClinicalHistoryNotice] =
    useState<string | null>(null);
  const [clinicalHistoryNoticeTone, setClinicalHistoryNoticeTone] = useState<
    'success' | 'error'
  >('success');
  const [observationNotice, setObservationNotice] = useState<string | null>(
    null,
  );
  const [observationNoticeTone, setObservationNoticeTone] = useState<
    'success' | 'error'
  >('success');

  const refreshResidentAudit = useCallback(async (): Promise<void> => {
    if (!residentId || !token) {
      return;
    }

    const residentPayload = await residentsService.getResidentById(residentId);
    setResident(unwrapEnvelope(residentPayload));
  }, [residentId, token]);

  const loadResidentDetail = useCallback(async (): Promise<void> => {
    if (!residentId) {
      setResident(null);
      setResidentLiveProfile(null);
      setClinicalHistory([]);
      setObservations([]);
      setResidentError('No encontre el residente solicitado.');
      setScreenState('error');
      return;
    }

    if (!token) {
      setResident(null);
      setResidentLiveProfile(null);
      setClinicalHistory([]);
      setObservations([]);
      setResidentError(null);
      setScreenState('loading');
      return;
    }

    setScreenState('loading');
    setResidentError(null);

    try {
      const [
        residentPayload,
        residentLiveProfilePayload,
        clinicalHistoryPayload,
        observationsPayload,
      ] = await Promise.all([
        residentsService.getResidentById(residentId),
        residentsService.getResidentLiveProfile(residentId),
        residentsService.getClinicalHistoryEvents(residentId),
        residentsService.getResidentObservations(residentId),
      ]);

      setResident(unwrapEnvelope(residentPayload));
      setResidentLiveProfile(unwrapEnvelope(residentLiveProfilePayload));
      setClinicalHistory(unwrapEnvelope(clinicalHistoryPayload));
      setObservations(sortObservationList(unwrapEnvelope(observationsPayload)));
      setScreenState('ready');
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'No pude cargar el detalle del residente.',
      );

      if (message === 'Unauthorized.') {
        await logout();
        return;
      }

      setResident(null);
      setResidentLiveProfile(null);
      setClinicalHistory([]);
      setObservations([]);
      setResidentError(message);
      setScreenState('error');
    }
  }, [logout, residentId, token]);

  const handleClinicalHistoryCreate = useCallback(
    async (
      input: ClinicalHistoryEventCreateInput,
    ): Promise<ClinicalHistoryEvent | null> => {
      if (!residentId) {
        setClinicalHistoryNoticeTone('error');
        setClinicalHistoryNotice('No encontre el residente solicitado.');
        return null;
      }

      if (!token) {
        await logout();
        return null;
      }

      setIsSavingClinicalHistoryEvent(true);
      setClinicalHistoryNotice(null);

      try {
        const payload = await residentsService.createClinicalHistoryEvent(
          residentId,
          input,
        );
        const result = unwrapEnvelope(payload);
        const createdEvent = result.event;

        setClinicalHistory((current) =>
          [createdEvent, ...current].sort((left, right) =>
            right.occurredAt.localeCompare(left.occurredAt),
          ),
        );
        // Refrescamos el residente para que el badge "En observacion" y el
        // bloque de auditoria reflejen el nuevo estado al instante.
        await refreshResidentAudit();

        setClinicalHistoryNoticeTone('success');
        if (result.careStatus?.changed) {
          setClinicalHistoryNotice(
            'Evento clinico agregado y residente puesto en observacion.',
          );
        } else if (
          result.careStatus !== null &&
          result.careStatus.changed === false
        ) {
          setClinicalHistoryNotice(
            'Evento clinico agregado. El residente ya se encontraba en observacion.',
          );
        } else {
          setClinicalHistoryNotice('Evento clinico agregado correctamente.');
        }

        return createdEvent;
      } catch (error) {
        const message = getApiErrorMessage(
          error,
          'No pude guardar el evento clinico.',
        );

        if (message === 'Unauthorized.') {
          await logout();
          return null;
        }

        setClinicalHistoryNoticeTone('error');
        setClinicalHistoryNotice(message);
        return null;
      } finally {
        setIsSavingClinicalHistoryEvent(false);
      }
    },
    [logout, refreshResidentAudit, residentId, token],
  );

  const [isUpdatingCareStatus, setIsUpdatingCareStatus] = useState(false);
  const [careStatusNotice, setCareStatusNotice] = useState<string | null>(null);
  const [careStatusNoticeTone, setCareStatusNoticeTone] = useState<
    'success' | 'error'
  >('success');

  const handleCareStatusChange = useCallback(
    async (toStatus: ResidentCareStatus): Promise<boolean> => {
      if (!residentId) {
        setCareStatusNoticeTone('error');
        setCareStatusNotice('No encontre el residente solicitado.');
        return false;
      }

      if (!token) {
        await logout();
        return false;
      }

      setIsUpdatingCareStatus(true);
      setCareStatusNotice(null);

      try {
        const payload = await residentsService.updateResidentCareStatus(
          residentId,
          toStatus,
        );
        const result = unwrapEnvelope(payload);

        setResident(result.resident);

        setCareStatusNoticeTone('success');
        if (result.changed) {
          setCareStatusNotice(
            toStatus === 'normal'
              ? 'Residente quitado de observacion.'
              : 'Residente puesto en observacion.',
          );
        } else {
          // El backend devuelve `changed: false` solo cuando from === to, lo
          // que ya no debería ocurrir desde la UI (el botón se oculta), pero
          // mantenemos un mensaje seguro por si acaso.
          setCareStatusNotice('El residente ya se encontraba en ese estado.');
        }
        return true;
      } catch (error) {
        const message = getApiErrorMessage(
          error,
          'No pude actualizar el estado del residente.',
        );

        if (message === 'Unauthorized.') {
          await logout();
          return false;
        }

        setCareStatusNoticeTone('error');
        setCareStatusNotice(message);
        return false;
      } finally {
        setIsUpdatingCareStatus(false);
      }
    },
    [logout, residentId, token],
  );

  const handleObservationCreate = useCallback(
    async (
      input: ResidentObservationCreateInput,
    ): Promise<ResidentObservation | null> => {
      if (!residentId) {
        setObservationNoticeTone('error');
        setObservationNotice('No encontre el residente solicitado.');
        return null;
      }

      if (!token) {
        await logout();
        return null;
      }

      setIsSavingObservation(true);
      setActiveObservationMutationId('create');
      setObservationNotice(null);

      try {
        const payload = await residentsService.createResidentObservation(
          residentId,
          input,
        );
        const createdObservation = unwrapEnvelope(payload);

        setObservations((current) =>
          sortObservationList([createdObservation, ...current]),
        );
        await refreshResidentAudit();
        setObservationNoticeTone('success');
        setObservationNotice('Observacion abierta correctamente.');
        return createdObservation;
      } catch (error) {
        const message = getApiErrorMessage(
          error,
          'No pude abrir la observacion.',
        );

        if (message === 'Unauthorized.') {
          await logout();
          return null;
        }

        setObservationNoticeTone('error');
        setObservationNotice(message);
        return null;
      } finally {
        setIsSavingObservation(false);
        setActiveObservationMutationId(null);
      }
    },
    [logout, refreshResidentAudit, residentId, token],
  );

  const handleObservationEntryCreate = useCallback(
    async (
      observationId: string,
      input: ResidentObservationEntryCreateInput,
    ): Promise<ResidentObservation | null> => {
      if (!residentId) {
        setObservationNoticeTone('error');
        setObservationNotice('No encontre el residente solicitado.');
        return null;
      }

      if (!token) {
        await logout();
        return null;
      }

      setIsSavingObservation(true);
      setActiveObservationMutationId(observationId);
      setObservationNotice(null);

      try {
        const payload = await residentsService.createResidentObservationEntry(
          residentId,
          observationId,
          input,
        );
        const updatedObservation = unwrapEnvelope(payload);

        setObservations((current) =>
          sortObservationList(
            current.map((observation) =>
              observation.id === updatedObservation.id
                ? updatedObservation
                : observation,
            ),
          ),
        );
        await refreshResidentAudit();
        setObservationNoticeTone('success');
        setObservationNotice('Seguimiento guardado correctamente.');
        return updatedObservation;
      } catch (error) {
        const message = getApiErrorMessage(
          error,
          'No pude guardar el seguimiento.',
        );

        if (message === 'Unauthorized.') {
          await logout();
          return null;
        }

        setObservationNoticeTone('error');
        setObservationNotice(message);
        return null;
      } finally {
        setIsSavingObservation(false);
        setActiveObservationMutationId(null);
      }
    },
    [logout, refreshResidentAudit, residentId, token],
  );

  const handleObservationResolve = useCallback(
    async (
      observationId: string,
      input: ResidentObservationResolveInput,
    ): Promise<ResidentObservation | null> => {
      if (!residentId) {
        setObservationNoticeTone('error');
        setObservationNotice('No encontre el residente solicitado.');
        return null;
      }

      if (!token) {
        await logout();
        return null;
      }

      setIsSavingObservation(true);
      setActiveObservationMutationId(observationId);
      setObservationNotice(null);

      try {
        const payload = await residentsService.resolveResidentObservation(
          residentId,
          observationId,
          input,
        );
        const resolvedObservation = unwrapEnvelope(payload);

        setObservations((current) =>
          sortObservationList(
            current.map((observation) =>
              observation.id === resolvedObservation.id
                ? resolvedObservation
                : observation,
            ),
          ),
        );
        await refreshResidentAudit();
        setObservationNoticeTone('success');
        setObservationNotice('Observacion cerrada correctamente.');
        return resolvedObservation;
      } catch (error) {
        const message = getApiErrorMessage(
          error,
          'No pude cerrar la observacion.',
        );

        if (message === 'Unauthorized.') {
          await logout();
          return null;
        }

        setObservationNoticeTone('error');
        setObservationNotice(message);
        return null;
      } finally {
        setIsSavingObservation(false);
        setActiveObservationMutationId(null);
      }
    },
    [logout, refreshResidentAudit, residentId, token],
  );

  useEffect(() => {
    if (status !== 'authenticated' || !token) {
      setResident(null);
      setResidentLiveProfile(null);
      setClinicalHistory([]);
      setObservations([]);
      setResidentError(null);
      setScreenState('loading');
      return;
    }

    void loadResidentDetail();
  }, [loadResidentDetail, status, token]);

  return {
    screenState,
    resident,
    residentLiveProfile,
    residentError,
    clinicalHistory,
    observations,
    isSavingClinicalHistoryEvent,
    isSavingObservation,
    activeObservationMutationId,
    clinicalHistoryNotice,
    clinicalHistoryNoticeTone,
    observationNotice,
    observationNoticeTone,
    isUpdatingCareStatus,
    careStatusNotice,
    careStatusNoticeTone,
    handleRetry: loadResidentDetail,
    handleClinicalHistoryCreate,
    handleObservationCreate,
    handleObservationEntryCreate,
    handleObservationResolve,
    handleCareStatusChange,
  };
}

function sortObservationList(
  observations: ResidentObservation[],
): ResidentObservation[] {
  return [...observations].sort((left, right) => {
    if (left.status !== right.status) {
      return left.status === 'active' ? -1 : 1;
    }

    return (
      resolveObservationActivityDate(right) - resolveObservationActivityDate(left)
    );
  });
}

function resolveObservationActivityDate(observation: ResidentObservation): number {
  const latestEntryAt = observation.entries[0]?.occurredAt;

  return new Date(
    latestEntryAt ?? observation.resolvedAt ?? observation.openedAt,
  ).getTime();
}
