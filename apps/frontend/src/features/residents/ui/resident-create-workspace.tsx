import type { AuthSession } from '@gentrix/shared-types';

import type { ResidentFormValues } from '../types/resident-form-values';
import { PageToolbar } from '../../../shared/ui/page-toolbar';
import { WorkspaceShell } from '../../dashboard/ui/workspace-shell';
import { StatusNotice } from '../../dashboard/ui/status-notice';
import type { DashboardScreenState } from '../../dashboard/types/dashboard-screen-state';
import { AdmissionsPanel } from './admissions-panel';

interface ResidentCreateWorkspaceProps {
  screenState: DashboardScreenState;
  session: AuthSession;
  authError: string | null;
  isSavingResident: boolean;
  residentCount: number;
  residentNoticeTone: 'success' | 'error';
  residentNotice: string | null;
  onResidentCreate: (values: ResidentFormValues) => Promise<unknown>;
  onLogout: () => void | Promise<void>;
}

export function ResidentCreateWorkspace({
  screenState,
  session,
  authError,
  isSavingResident,
  residentCount,
  residentNoticeTone,
  residentNotice,
  onResidentCreate,
  onLogout,
}: ResidentCreateWorkspaceProps) {
  return (
    <WorkspaceShell
      residentCount={residentCount}
      session={session}
      onLogout={onLogout}
    >
      <PageToolbar
        section="Residentes"
        title="Alta paciente"
        backTitle="Volver a residentes"
        backFallbackTo="/residentes"
      />

      {screenState === 'error' && authError && (
        <StatusNotice
          title="No se pudo actualizar el padron."
          message={`${authError} Igual puede completar el alta y guardar el paciente.`}
        />
      )}

      <AdmissionsPanel
        isSavingResident={isSavingResident}
        residentCount={residentCount}
        residentNoticeTone={residentNoticeTone}
        residentNotice={residentNotice}
        showPanelHeader={false}
        onSubmit={onResidentCreate}
      />
    </WorkspaceShell>
  );
}
