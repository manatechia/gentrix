import { useCallback, useEffect, useState } from 'react';

import type {
  ClinicalHistoryEvent,
  ClinicalHistoryEventCreateInput,
  ResidentDetail,
  ResidentLiveProfile,
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
  const [isSavingClinicalHistoryEvent, setIsSavingClinicalHistoryEvent] =
    useState(false);
  const [clinicalHistoryNotice, setClinicalHistoryNotice] =
    useState<string | null>(null);
  const [clinicalHistoryNoticeTone, setClinicalHistoryNoticeTone] = useState<
    'success' | 'error'
  >('success');

  const loadResidentDetail = useCallback(async (): Promise<void> => {
    if (!residentId) {
      setResident(null);
      setResidentLiveProfile(null);
      setClinicalHistory([]);
      setResidentError('No encontre el residente solicitado.');
      setScreenState('error');
      return;
    }

    if (!token) {
      setResident(null);
      setResidentLiveProfile(null);
      setClinicalHistory([]);
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
      ] = await Promise.all([
        residentsService.getResidentById(residentId),
        residentsService.getResidentLiveProfile(residentId),
        residentsService.getClinicalHistoryEvents(residentId),
      ]);

      setResident(unwrapEnvelope(residentPayload));
      setResidentLiveProfile(unwrapEnvelope(residentLiveProfilePayload));
      setClinicalHistory(unwrapEnvelope(clinicalHistoryPayload));
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
        const createdEvent = unwrapEnvelope(payload);

        setClinicalHistory((current) =>
          [createdEvent, ...current].sort((left, right) =>
            right.occurredAt.localeCompare(left.occurredAt),
          ),
        );
        setClinicalHistoryNoticeTone('success');
        setClinicalHistoryNotice('Evento clinico agregado correctamente.');

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
    [logout, residentId, token],
  );

  useEffect(() => {
    if (status !== 'authenticated' || !token) {
      setResident(null);
      setResidentLiveProfile(null);
      setClinicalHistory([]);
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
    isSavingClinicalHistoryEvent,
    clinicalHistoryNotice,
    clinicalHistoryNoticeTone,
    handleRetry: loadResidentDetail,
    handleClinicalHistoryCreate,
  };
}
