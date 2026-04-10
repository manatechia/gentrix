import { useMemo } from 'react';

import type { AuthSession, ResidentDetail } from '@gentrix/shared-types';

import { PageToolbar } from '../../../shared/ui/page-toolbar';
import { WorkspaceShell } from '../../dashboard/ui/workspace-shell';
import { StatusNotice } from '../../dashboard/ui/status-notice';
import type { DashboardScreenState } from '../../dashboard/types/dashboard-screen-state';
import { toResidentFormValues } from '../lib/resident-form-adapter';
import type { ResidentFormValues } from '../types/resident-form-values';
import { AdmissionsPanel } from './admissions-panel';

interface ResidentEditWorkspaceProps {
  screenState: DashboardScreenState;
  session: AuthSession;
  residentCount: number;
  resident: ResidentDetail | null;
  residentError: string | null;
  isSavingResident: boolean;
  residentNoticeTone: 'success' | 'error';
  residentNotice: string | null;
  onResidentUpdate: (values: ResidentFormValues) => Promise<unknown>;
  onLogout: () => void | Promise<void>;
  onRetry: () => void | Promise<void>;
}

export function ResidentEditWorkspace({
  screenState,
  session,
  residentCount,
  resident,
  residentError,
  isSavingResident,
  residentNoticeTone,
  residentNotice,
  onResidentUpdate,
  onLogout,
  onRetry,
}: ResidentEditWorkspaceProps) {
  const detailHref = resident ? `/residentes/${resident.id}` : '/residentes';
  const initialValues = useMemo(
    () => (resident ? toResidentFormValues(resident) : null),
    [resident],
  );

  return (
    <WorkspaceShell
      residentCount={residentCount}
      session={session}
      onLogout={onLogout}
    >
      <PageToolbar
        section="Residentes"
        title="Editar paciente"
        backTitle="Volver a ficha"
        backFallbackTo={detailHref}
      />

      {screenState === 'loading' && (
        <StatusNotice message="Cargando los datos del paciente para editar." />
      )}

      {screenState === 'error' && (
        <StatusNotice
          title="No pude cargar el formulario de edicion."
          message={residentError ?? 'Ocurrio un error inesperado.'}
          actions={[
            {
              label: 'Reintentar',
              onClick: onRetry,
            },
          ]}
        />
      )}

      {screenState === 'ready' && resident && (
        <AdmissionsPanel
          mode="edit"
          initialValues={initialValues ?? undefined}
          showMedicalHistorySection={false}
          showPanelHeader={false}
          isSavingResident={isSavingResident}
          residentCount={residentCount}
          residentNoticeTone={residentNoticeTone}
          residentNotice={residentNotice}
          submitLabel="Guardar cambios"
          secondaryAction={{
            href: detailHref,
            label: 'Cancelar',
          }}
          onSubmit={onResidentUpdate}
        />
      )}
    </WorkspaceShell>
  );
}
