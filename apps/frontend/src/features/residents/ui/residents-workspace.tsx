import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import type { AuthSession, ResidentOverview } from '@gentrix/shared-types';

import { canManageResidents } from '../../../shared/lib/authz';
import {
  badgeBaseClassName,
  inputClassName,
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
  residents: ResidentOverview[];
  onLogout: () => void | Promise<void>;
  onRetry: () => void | Promise<void>;
}

export function ResidentsWorkspace({
  screenState,
  session,
  authError,
  residentCount,
  residents,
  onLogout,
  onRetry,
}: ResidentsWorkspaceProps) {
  const canManageRecords = canManageResidents(session.user.role);
  const [query, setQuery] = useState('');
  const normalizedQuery = normalizeResidentQuery(query);
  const filteredResidents = useMemo(
    () =>
      residents.filter((resident) =>
        normalizeResidentQuery(resident.fullName).includes(normalizedQuery),
      ),
    [normalizedQuery, residents],
  );

  return (
    <WorkspaceShell
      residentCount={residentCount}
      session={session}
      onLogout={onLogout}
    >
      <section
        className={`${shellCardClassName} grid gap-3 px-4 py-4 min-[900px]:grid-cols-[minmax(0,1fr)_auto] min-[900px]:items-center min-[900px]:px-5`}
      >
        <label className="w-full min-[900px]:max-w-[520px]">
          <input
            data-testid="resident-search-input"
            className={inputClassName}
            type="search"
            placeholder="Nombre del paciente"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <div className="flex flex-wrap items-center gap-2.5">
          <span
            className={`${badgeBaseClassName} bg-brand-secondary/12 text-brand-secondary`}
          >
            {filteredResidents.length} visibles
          </span>
          {canManageRecords ? (
            <Link
              className={primaryButtonClassName}
              data-testid="residents-add-button"
              to="/residentes/nuevo"
            >
              Agregar paciente
            </Link>
          ) : null}
        </div>
      </section>

      {screenState === 'loading' && (
        <StatusNotice message="Cargando residentes con la sesión activa." />
      )}

      {screenState === 'error' && (
        <StatusNotice
          title="No se pudo cargar los residentes."
          message={authError ?? 'Ocurrió un error inesperado.'}
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
        <ResidentsPanel residents={filteredResidents} residentBasePath="/residentes" />
      )}
    </WorkspaceShell>
  );
}

function normalizeResidentQuery(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}
