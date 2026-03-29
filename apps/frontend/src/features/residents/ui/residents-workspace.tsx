import { Link } from 'react-router-dom';

import type { AuthSession, ResidentOverview } from '@gentrix/shared-types';

import { canManageResidents, isStaffRole } from '../../../shared/lib/authz';
import {
  primaryButtonClassName,
  shellCardClassName,
} from '../../../shared/ui/class-names';
import { WorkspaceShell } from '../../dashboard/ui/workspace-shell';
import { StatusNotice } from '../../dashboard/ui/status-notice';
import type { DashboardScreenState } from '../../dashboard/types/dashboard-screen-state';
import { ResidentsPanel } from './residents-panel';

interface ResidentsWorkspaceProps {
  screenState: DashboardScreenState;
  session: AuthSession;
  authError: string | null;
  residentCount: number;
  memoryCareResidents: number;
  residents: ResidentOverview[];
  onLogout: () => void | Promise<void>;
  onRetry: () => void | Promise<void>;
}

export function ResidentsWorkspace({
  screenState,
  session,
  authError,
  residentCount,
  memoryCareResidents,
  residents,
  onLogout,
  onRetry,
}: ResidentsWorkspaceProps) {
  const canManageRecords = canManageResidents(session.user.role);
  const isStaffSession = isStaffRole(session.user.role);

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
            Padron de residentes
          </h1>
          <p className="max-w-[58ch] leading-[1.65] text-brand-text-secondary">
            {isStaffSession
              ? 'Consulta el padron operativo y abre cada ficha sin editar datos administrativos.'
              : 'Consulta todos los pacientes actuales, entra a cada ficha y deriva las nuevas altas a una subpagina propia del modulo.'}
          </p>
        </div>

        {canManageRecords ? (
          <Link
            className={primaryButtonClassName}
            data-testid="residents-add-button"
            to="/residentes/nuevo"
          >
            Agregar paciente
          </Link>
        ) : (
          <span className={primaryButtonClassName}>Vista personal</span>
        )}
      </section>

      {screenState === 'loading' && (
        <StatusNotice message="Cargando residentes con la sesion activa." />
      )}

      {screenState === 'error' && (
        <StatusNotice
          title="No pude cargar los residentes."
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

      {screenState === 'ready' && (
        <ResidentsPanel
          residents={residents}
          memoryCareResidents={memoryCareResidents}
          residentBasePath="/residentes"
        />
      )}
    </WorkspaceShell>
  );
}
