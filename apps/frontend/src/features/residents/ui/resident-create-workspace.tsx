import { Link } from 'react-router-dom';

import type { AuthSession } from '@gentrix/shared-types';

import type { ResidentFormValues } from '../types/resident-form-values';
import {
  primaryButtonClassName,
  secondaryButtonClassName,
  shellCardClassName,
} from '../../../shared/ui/class-names';
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
      <section
        className={`${shellCardClassName} flex flex-wrap items-start justify-between gap-5 px-7 py-6`}
      >
        <div className="grid gap-2.5">
          <span className="inline-flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-primary">
            Residentes
          </span>
          <h1 className="text-[clamp(2rem,3.2vw,2.6rem)] font-bold tracking-[-0.04em] text-brand-text">
            Alta de paciente
          </h1>
          <p className="max-w-[58ch] leading-[1.65] text-brand-text-secondary">
            El alta ahora vive en una subpagina propia y concentra los datos
            de identidad principales del residente, sus antecedentes medicos
            y los adjuntos clinicos necesarios. La edad se muestra como
            calculo automatico para validar rapidamente la carga.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link className={secondaryButtonClassName} to="/residentes">
            Volver a residentes
          </Link>
          <span className={primaryButtonClassName}>{residentCount} residentes</span>
        </div>
      </section>

      {screenState === 'error' && authError && (
        <StatusNotice
          title="No pude actualizar el padron."
          message={`${authError} Igual podes completar el alta y guardar el paciente.`}
        />
      )}

      <AdmissionsPanel
        isSavingResident={isSavingResident}
        residentCount={residentCount}
        residentNoticeTone={residentNoticeTone}
        residentNotice={residentNotice}
        onSubmit={onResidentCreate}
      />
    </WorkspaceShell>
  );
}
