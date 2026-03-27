import { useEffect, useState } from 'react';

import type {
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
  const auth = useAuthSession();
  const [screenState, setScreenState] =
    useState<DashboardScreenState>('loading');
  const [resident, setResident] = useState<ResidentDetail | null>(null);
  const [residentLiveProfile, setResidentLiveProfile] =
    useState<ResidentLiveProfile | null>(null);
  const [residentError, setResidentError] = useState<string | null>(null);

  async function loadResidentDetail(): Promise<void> {
    if (!residentId) {
      setResident(null);
      setResidentLiveProfile(null);
      setResidentError('No encontre el residente solicitado.');
      setScreenState('error');
      return;
    }

    if (!auth.token) {
      setResident(null);
      setResidentLiveProfile(null);
      setResidentError(null);
      setScreenState('loading');
      return;
    }

    setScreenState('loading');
    setResidentError(null);

    try {
      const [residentPayload, residentLiveProfilePayload] = await Promise.all([
        residentsService.getResidentById(residentId),
        residentsService.getResidentLiveProfile(residentId),
      ]);
      setResident(unwrapEnvelope(residentPayload));
      setResidentLiveProfile(unwrapEnvelope(residentLiveProfilePayload));
      setScreenState('ready');
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'No pude cargar el detalle del residente.',
      );

      if (message === 'Unauthorized.') {
        await auth.logout();
        return;
      }

      setResident(null);
      setResidentLiveProfile(null);
      setResidentError(message);
      setScreenState('error');
    }
  }

  useEffect(() => {
    if (auth.status !== 'authenticated' || !auth.token) {
      setResident(null);
      setResidentLiveProfile(null);
      setResidentError(null);
      setScreenState('loading');
      return;
    }

    void loadResidentDetail();
  }, [auth.status, auth.token, residentId]);

  return {
    screenState,
    resident,
    residentLiveProfile,
    residentError,
    handleRetry: loadResidentDetail,
  };
}
