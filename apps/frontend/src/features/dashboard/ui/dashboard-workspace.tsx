import type {
  AuthSession,
  DashboardSnapshot,
  ResidentAgendaOccurrenceWithResident,
} from '@gentrix/shared-types';

import { getDashboardVariant } from '../lib/dashboard-variant';
import type { DashboardScreenState } from '../types/dashboard-screen-state';
import { ManagementDashboard } from './management-dashboard';
import { OperationalDashboard } from './operational-dashboard';
import { StatusNotice } from './status-notice';
import { WorkspaceShell } from './workspace-shell';

interface DashboardWorkspaceProps {
  screenState: DashboardScreenState;
  session: AuthSession;
  dashboard: DashboardSnapshot | null;
  authError: string | null;
  residentCount: number;
  upcomingAgendaOccurrences: ResidentAgendaOccurrenceWithResident[];
  onLogout: () => void | Promise<void>;
  onRetry: () => void | Promise<void>;
}

export function DashboardWorkspace({
  screenState,
  session,
  dashboard,
  authError,
  residentCount,
  upcomingAgendaOccurrences,
  onLogout,
  onRetry,
}: DashboardWorkspaceProps) {
  const variant = getDashboardVariant(session.user.role);

  return (
    <WorkspaceShell
      residentCount={residentCount}
      session={session}
      onLogout={onLogout}
    >
      {screenState === 'loading' && (
        <StatusNotice message="Cargando el tablero con la sesion activa." />
      )}

      {screenState === 'error' && (
        <StatusNotice
          title="No pude cargar el tablero."
          message={authError ?? 'Ocurrio un error inesperado.'}
          actions={[
            {
              label: 'Reintentar',
              onClick: onRetry,
            },
            {
              label: 'Volver al ingreso',
              onClick: onLogout,
              variant: 'secondary',
            },
          ]}
        />
      )}

      {screenState === 'ready' && dashboard && (
        variant === 'operational' ? (
          <OperationalDashboard
            session={session}
            dashboard={dashboard}
            upcomingAgendaOccurrences={upcomingAgendaOccurrences}
            onRefresh={onRetry}
          />
        ) : (
          <ManagementDashboard
            dashboard={dashboard}
            upcomingAgendaOccurrences={upcomingAgendaOccurrences}
          />
        )
      )}
    </WorkspaceShell>
  );
}
