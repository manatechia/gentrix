import { useEffect, useState } from 'react';

import type { HandoffSnapshot } from '@gentrix/shared-types';

import { useAuthSession } from '../../auth/hooks/use-auth-session';
import type { DashboardScreenState } from '../../dashboard/types/dashboard-screen-state';
import {
  getApiErrorMessage,
  unwrapEnvelope,
} from '../../../shared/lib/api-envelope';
import * as handoffService from '../services/handoff-service';

export function useHandoffRoute() {
  const auth = useAuthSession();
  const [screenState, setScreenState] =
    useState<DashboardScreenState>('loading');
  const [handoff, setHandoff] = useState<HandoffSnapshot | null>(null);
  const [handoffError, setHandoffError] = useState<string | null>(null);

  async function loadHandoff(): Promise<void> {
    if (!auth.token) {
      setHandoff(null);
      setHandoffError(null);
      setScreenState('loading');
      return;
    }

    setScreenState('loading');
    setHandoffError(null);

    try {
      const payload = await handoffService.getHandoffSnapshot();
      setHandoff(unwrapEnvelope(payload));
      setScreenState('ready');
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'No pude cargar el pase de turno.',
      );

      if (message === 'Unauthorized.') {
        await auth.logout();
        return;
      }

      setHandoffError(message);
      setScreenState('error');
    }
  }

  useEffect(() => {
    if (auth.status !== 'authenticated' || !auth.token) {
      setHandoff(null);
      setHandoffError(null);
      setScreenState('loading');
      return;
    }

    void loadHandoff();
  }, [auth.status, auth.token]);

  async function refreshHandoffInPlace(): Promise<void> {
    const payload = await handoffService.getHandoffSnapshot();
    setHandoff(unwrapEnvelope(payload));
    setHandoffError(null);
    setScreenState('ready');
  }

  return {
    screenState,
    handoff,
    handoffError,
    residentCount: handoff?.summary.residentCount ?? 0,
    handleRetry: refreshHandoffInPlace,
  };
}
