import { useCallback, useEffect, useState } from 'react';

import type {
  ResidentCareStatusChangeEvent,
  ResidentCareStatusUpdateInput,
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
  const [careStatusChanges, setCareStatusChanges] = useState<
    ResidentCareStatusChangeEvent[]
  >([]);

  const loadResidentDetail = useCallback(async (): Promise<void> => {
    if (!residentId) {
      setResident(null);
      setResidentLiveProfile(null);
      setCareStatusChanges([]);
      setResidentError('No se encontró el residente solicitado.');
      setScreenState('error');
      return;
    }

    if (!token) {
      setResident(null);
      setResidentLiveProfile(null);
      setCareStatusChanges([]);
      setResidentError(null);
      setScreenState('loading');
      return;
    }

    setScreenState('loading');
    setResidentError(null);

    try {
      const [residentPayload, residentLiveProfilePayload, careStatusChangesPayload] =
        await Promise.all([
          residentsService.getResidentById(residentId),
          residentsService.getResidentLiveProfile(residentId),
          residentsService.getResidentCareStatusChanges(residentId),
        ]);

      setResident(unwrapEnvelope(residentPayload));
      setResidentLiveProfile(unwrapEnvelope(residentLiveProfilePayload));
      setCareStatusChanges(unwrapEnvelope(careStatusChangesPayload));
      setScreenState('ready');
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'No se pudo cargar el detalle del residente.',
      );

      if (message === 'Unauthorized.') {
        await logout();
        return;
      }

      setResident(null);
      setResidentLiveProfile(null);
      setCareStatusChanges([]);
      setResidentError(message);
      setScreenState('error');
    }
  }, [logout, residentId, token]);

  const [isUpdatingCareStatus, setIsUpdatingCareStatus] = useState(false);
  const [careStatusNotice, setCareStatusNotice] = useState<string | null>(null);
  const [careStatusNoticeTone, setCareStatusNoticeTone] = useState<
    'success' | 'error'
  >('success');

  const handleCareStatusChange = useCallback(
    async (input: ResidentCareStatusUpdateInput): Promise<boolean> => {
      if (!residentId) {
        setCareStatusNoticeTone('error');
        setCareStatusNotice('No se encontró el residente solicitado.');
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
          input,
        );
        const result = unwrapEnvelope(payload);

        setResident(result.resident);
        if (result.changeEvent) {
          setCareStatusChanges((current) => [...current, result.changeEvent!]);
        }

        setCareStatusNoticeTone('success');
        if (result.changed) {
          setCareStatusNotice(
            input.toStatus === 'normal'
              ? 'Residente quitado de observacion.'
              : 'Residente puesto en observacion.',
          );
        } else {
          setCareStatusNotice('El residente ya se encontraba en ese estado.');
        }
        return true;
      } catch (error) {
        const message = getApiErrorMessage(
          error,
          'No se pudo actualizar el estado del residente.',
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

  useEffect(() => {
    if (status !== 'authenticated' || !token) {
      setResident(null);
      setResidentLiveProfile(null);
      setCareStatusChanges([]);
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
    careStatusChanges,
    isUpdatingCareStatus,
    careStatusNotice,
    careStatusNoticeTone,
    handleRetry: loadResidentDetail,
    handleCareStatusChange,
  };
}
