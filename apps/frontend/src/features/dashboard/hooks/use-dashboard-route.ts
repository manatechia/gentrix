import { useEffect, useMemo, useState } from 'react';

import type { DashboardSnapshot } from '@gentrix/shared-types';

import { useAuthSession } from '../../auth/hooks/use-auth-session';
import {
  getApiErrorMessage,
  unwrapEnvelope,
} from '../../../shared/lib/api-envelope';
import * as dashboardService from '../services/dashboard-service';
import type { DashboardScreenState } from '../types/dashboard-screen-state';

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

export function useDashboardRoute() {
  const auth = useAuthSession();
  const [screenState, setScreenState] =
    useState<DashboardScreenState>('loading');
  const [dashboard, setDashboard] = useState<DashboardSnapshot | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  async function loadDashboard(): Promise<void> {
    if (!auth.token) {
      setDashboard(null);
      setDashboardError(null);
      setScreenState('loading');
      return;
    }

    setScreenState('loading');
    setDashboardError(null);

    try {
      const payload = await dashboardService.getDashboardSnapshot();
      setDashboard(unwrapEnvelope(payload));
      setScreenState('ready');
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'No pude cargar el tablero.',
      );

      if (message === 'Unauthorized.') {
        await auth.logout();
        return;
      }

      setDashboardError(message);
      setScreenState('error');
    }
  }

  useEffect(() => {
    if (auth.status !== 'authenticated' || !auth.token) {
      setDashboard(null);
      setDashboardError(null);
      setScreenState('loading');
      return;
    }

    void loadDashboard();
  }, [auth.status, auth.token]);

  async function refreshDashboardInPlace(): Promise<void> {
    const payload = await dashboardService.getDashboardSnapshot();
    setDashboard(unwrapEnvelope(payload));
    setDashboardError(null);
    setScreenState('ready');
  }

  const medications = useMemo(
    () => dedupeById(dashboard?.medications ?? []),
    [dashboard?.medications],
  );

  return {
    screenState,
    dashboard,
    dashboardError,
    medications,
    residentCount: dashboard?.summary.residentCount ?? 0,
    handleRetry: refreshDashboardInPlace,
  };
}
