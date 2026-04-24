import type { AuthSession, MedicationDetail } from '@gentrix/shared-types';

import { toMedicationEditFormValues } from '../lib/medication-form-adapter';
import { shellCardClassName } from '../../../shared/ui/class-names';
import { BackChevronButton } from '../../../shared/ui/back-chevron-button';
import type { SelectFieldOption } from '../../../shared/ui/select-field';
import { WorkspaceShell } from '../../dashboard/ui/workspace-shell';
import { StatusNotice } from '../../dashboard/ui/status-notice';
import type { DashboardScreenState } from '../../dashboard/types/dashboard-screen-state';
import type { MedicationFormValues } from '../types/medication-form-values';
import { MedicationIntakePanel } from './medication-intake-panel';

interface MedicationEditWorkspaceProps {
  screenState: DashboardScreenState;
  session: AuthSession;
  residentCount: number;
  medication: MedicationDetail | null;
  medicationError: string | null;
  residentOptions: ReadonlyArray<SelectFieldOption>;
  medicationCatalogOptions: ReadonlyArray<SelectFieldOption>;
  isSavingMedication: boolean;
  medicationNoticeTone: 'success' | 'error';
  medicationNotice: string | null;
  onMedicationUpdate: (values: MedicationFormValues) => Promise<unknown>;
  onLogout: () => void | Promise<void>;
  onRetry: () => void | Promise<void>;
}

export function MedicationEditWorkspace({
  screenState,
  session,
  residentCount,
  medication,
  medicationError,
  residentOptions,
  medicationCatalogOptions,
  isSavingMedication,
  medicationNoticeTone,
  medicationNotice,
  onMedicationUpdate,
  onLogout,
  onRetry,
}: MedicationEditWorkspaceProps) {
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
              title="Volver a medicación"
              fallbackTo="/medicacion"
            />
            <span className="inline-flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-primary">
              Medicación
            </span>
          </div>
          <h1 className="text-[clamp(2rem,3.2vw,2.6rem)] font-bold tracking-[-0.04em] text-brand-text">
            Editar orden de medicación
          </h1>
          <p className="max-w-[58ch] leading-[1.65] text-brand-text-secondary">
            Ajuste la dosis, la agenda o el estado de la indicación y conserve el
            mismo flujo operativo del tablero clínico.
          </p>
        </div>
      </section>

      {screenState === 'loading' && (
        <StatusNotice message="Cargando la orden de medicación seleccionada." />
      )}

      {screenState === 'error' && (
        <StatusNotice
          title="No se pudo cargar la orden."
          message={medicationError ?? 'Ocurrió un error inesperado.'}
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

      {screenState === 'ready' && medication && (
        <MedicationIntakePanel
          mode="edit"
          initialValues={toMedicationEditFormValues(medication)}
          residentOptions={residentOptions}
          medicationCatalogOptions={medicationCatalogOptions}
          isSavingMedication={isSavingMedication}
          medicationNoticeTone={medicationNoticeTone}
          medicationNotice={medicationNotice}
          panelEyebrow="Edición"
          panelTitle={`Editar ${medication.medicationName}`}
          panelDescription={`Actualice la orden asociada a ${medication.residentName} y ajuste horarios, vigencia o estado según la necesidad clínica.`}
          panelBadgeText={medication.active ? 'Activa hoy' : 'Orden guardada'}
          submitLabel="Guardar cambios"
          secondaryAction={{ href: '/medicacion', label: 'Volver al listado' }}
          onSubmit={onMedicationUpdate}
        />
      )}
    </WorkspaceShell>
  );
}
