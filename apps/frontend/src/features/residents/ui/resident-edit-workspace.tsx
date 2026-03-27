import { useMemo } from 'react';

import type { AuthSession, ResidentDetail } from '@gentrix/shared-types';

import {
  primaryButtonClassName,
  shellCardClassName,
} from '../../../shared/ui/class-names';
import { BackChevronButton } from '../../../shared/ui/back-chevron-button';
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
      <section
        className={`${shellCardClassName} flex flex-wrap items-start justify-between gap-5 px-7 py-6`}
      >
        <div className="grid gap-2.5">
          <div className="flex items-center gap-3">
            <BackChevronButton
              title="Volver a ficha"
              fallbackTo={detailHref}
            />
            <span className="inline-flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-primary">
              Residentes
            </span>
          </div>
          <h1 className="text-[clamp(2rem,3.2vw,2.6rem)] font-bold tracking-[-0.04em] text-brand-text">
            Editar paciente
          </h1>
          <p className="max-w-[64ch] leading-[1.65] text-brand-text-secondary">
            Corrige los datos de ingreso ya cargados para{' '}
            <strong className="text-brand-text">
              {resident?.fullName ?? 'este residente'}
            </strong>
            . En esta version la edicion queda acotada al perfil base y al
            estado actual. Los antecedentes, contactos, adjuntos y demas
            registros de ingreso se preservan hasta tener flujos dedicados.
          </p>
        </div>

        <span className={primaryButtonClassName}>{residentCount} residentes</span>
      </section>

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
          isSavingResident={isSavingResident}
          residentCount={residentCount}
          residentNoticeTone={residentNoticeTone}
          residentNotice={residentNotice}
          panelEyebrow="Edicion"
          panelTitle="Editar paciente"
          panelDescription="Revisa identidad, ingreso, ubicacion y datos base del residente. Los registros temporales del intake quedan fuera de esta edicion para no reescribir snapshots completos."
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
