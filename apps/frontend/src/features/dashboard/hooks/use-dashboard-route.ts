import { useCallback, useEffect, useMemo, useState } from 'react';

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
  const { logout, status, token } = useAuthSession();
  const [screenState, setScreenState] =
    useState<DashboardScreenState>('loading');
  const [dashboard, setDashboard] = useState<DashboardSnapshot | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const loadDashboard = useCallback(async (): Promise<void> => {
    if (!token) {
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
        'No se pudo cargar el tablero.',
      );

      if (message === 'Unauthorized.') {
        await logout();
        return;
      }

      setDashboardError(message);
      setScreenState('error');
    }
  }, [logout, token]);

  useEffect(() => {
    if (status !== 'authenticated' || !token) {
      setDashboard(null);
      setDashboardError(null);
      setScreenState('loading');
      return;
    }

    void loadDashboard();
  }, [loadDashboard, status, token]);

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
    handleRetry: loadDashboard,
  };
}
