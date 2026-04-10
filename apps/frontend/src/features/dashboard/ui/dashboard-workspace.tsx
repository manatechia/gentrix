import type { AuthSession, DashboardSnapshot } from '@gentrix/shared-types';

import type { DashboardScreenState } from '../types/dashboard-screen-state';
import { MetricsGrid } from './metrics-grid';
import { StatusNotice } from './status-notice';
import { WorkspaceShell } from './workspace-shell';
import { AlertsPanel } from '../../alerts/ui/alerts-panel';
import { MedicationPanel } from '../../medication/ui/medication-panel';
import { StaffPanel } from '../../staff/ui/staff-panel';

interface DashboardWorkspaceProps {
  screenState: DashboardScreenState;
  session: AuthSession;
  dashboard: DashboardSnapshot | null;
  authError: string | null;
  residentCount: number;
  medications: DashboardSnapshot['medications'];
  onLogout: () => void | Promise<void>;
  onRetry: () => void | Promise<void>;
}

export function DashboardWorkspace({
  screenState,
  session,
  dashboard,
  authError,
  residentCount,
  medications,
  onLogout,
  onRetry,
}: DashboardWorkspaceProps) {
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
        <>
          <MetricsGrid dashboard={dashboard} />

          <section className="grid gap-[18px] min-[1181px]:grid-cols-[minmax(280px,0.95fr)_minmax(280px,0.95fr)_minmax(320px,1.1fr)]">
            <StaffPanel staff={dashboard.staff} />
            <MedicationPanel medications={medications} />
            <AlertsPanel alerts={dashboard.alerts} />
          </section>
        </>
      )}
    </WorkspaceShell>
  );
}
