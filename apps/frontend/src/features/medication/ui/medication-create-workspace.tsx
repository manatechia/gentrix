import type { AuthSession } from '@gentrix/shared-types';

import { shellCardClassName } from '../../../shared/ui/class-names';
import { BackChevronButton } from '../../../shared/ui/back-chevron-button';
import type { SelectFieldOption } from '../../../shared/ui/select-field';
import { WorkspaceShell } from '../../dashboard/ui/workspace-shell';
import { StatusNotice } from '../../dashboard/ui/status-notice';
import type { DashboardScreenState } from '../../dashboard/types/dashboard-screen-state';
import type { MedicationFormValues } from '../types/medication-form-values';
import { MedicationIntakePanel } from './medication-intake-panel';

interface MedicationCreateWorkspaceProps {
  screenState: DashboardScreenState;
  session: AuthSession;
  authError: string | null;
  residentCount: number;
  medicationCount: number;
  residentOptions: ReadonlyArray<SelectFieldOption>;
  medicationCatalogOptions: ReadonlyArray<SelectFieldOption>;
  isSavingMedication: boolean;
  medicationNoticeTone: 'success' | 'error';
  medicationNotice: string | null;
  onMedicationCreate: (values: MedicationFormValues) => Promise<unknown>;
  onLogout: () => void | Promise<void>;
}

export function MedicationCreateWorkspace({
  screenState,
  session,
  authError,
  residentCount,
  medicationCount,
  residentOptions,
  medicationCatalogOptions,
  isSavingMedication,
  medicationNoticeTone,
  medicationNotice,
  onMedicationCreate,
  onLogout,
}: MedicationCreateWorkspaceProps) {
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
              title="Volver a medicacion"
              fallbackTo="/medicacion"
            />
            <span className="inline-flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-primary">
              Medicacion
            </span>
          </div>
          <h1 className="text-[clamp(2rem,3.2vw,2.6rem)] font-bold tracking-[-0.04em] text-brand-text">
            Nueva orden de medicacion
          </h1>
          <p className="max-w-[58ch] leading-[1.65] text-brand-text-secondary">
            Carga una indicacion nueva, define su agenda y vincula la orden con
            el residente correcto sin salir del modulo.
          </p>
        </div>
      </section>

      {screenState === 'error' && authError && (
        <StatusNotice
          title="No pude actualizar el modulo."
          message={`${authError} Revisa la conexion antes de guardar una nueva orden.`}
        />
      )}

      <MedicationIntakePanel
        residentOptions={residentOptions}
        medicationCatalogOptions={medicationCatalogOptions}
        isSavingMedication={isSavingMedication}
        medicationNoticeTone={medicationNoticeTone}
        medicationNotice={medicationNotice}
        panelBadgeText={`${medicationCount} ordenes`}
        secondaryAction={{ href: '/medicacion', label: 'Cancelar' }}
        onSubmit={onMedicationCreate}
      />
    </WorkspaceShell>
  );
}
