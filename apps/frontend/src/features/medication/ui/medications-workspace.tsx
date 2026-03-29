import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import type {
  AuthSession,
  MedicationExecutionOverview,
  MedicationExecutionResult,
  MedicationOverview,
} from '@gentrix/shared-types';

import {
  canManageMedicationOrders,
  isStaffRole,
} from '../../../shared/lib/authz';
import {
  primaryButtonClassName,
  shellCardClassName,
} from '../../../shared/ui/class-names';
import type { SelectFieldOption } from '../../../shared/ui/select-field';
import { WorkspaceShell } from '../../dashboard/ui/workspace-shell';
import { StatusNotice } from '../../dashboard/ui/status-notice';
import type { DashboardScreenState } from '../../dashboard/types/dashboard-screen-state';
import { MedicationOrdersPanel } from './medication-orders-panel';

interface MedicationsWorkspaceProps {
  screenState: DashboardScreenState;
  session: AuthSession;
  authError: string | null;
  residentCount: number;
  medicationCount: number;
  activeMedicationCount: number;
  medications: MedicationOverview[];
  medicationExecutionsByMedicationId: Record<
    string,
    MedicationExecutionOverview[]
  >;
  recordingMedicationExecutionId: string | null;
  medicationNotice: string | null;
  medicationNoticeTone: 'success' | 'error';
  residentOptions: ReadonlyArray<SelectFieldOption>;
  onCreateMedicationExecution: (
    medication: MedicationOverview,
    result: MedicationExecutionResult,
  ) => void | Promise<MedicationExecutionOverview | null>;
  onLogout: () => void | Promise<void>;
  onRetry: () => void | Promise<void>;
}

interface MedicationsLocationState {
  medicationNotice?: string;
  medicationNoticeTone?: 'success' | 'error';
}

export function MedicationsWorkspace({
  screenState,
  session,
  authError,
  residentCount,
  medicationCount,
  activeMedicationCount,
  medications,
  medicationExecutionsByMedicationId,
  recordingMedicationExecutionId,
  medicationNotice,
  medicationNoticeTone,
  residentOptions,
  onCreateMedicationExecution,
  onLogout,
  onRetry,
}: MedicationsWorkspaceProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const medicationsLocationState =
    (location.state as MedicationsLocationState | null) ?? null;
  const routeMedicationNotice =
    medicationsLocationState?.medicationNotice ?? null;
  const routeMedicationNoticeTone =
    medicationsLocationState?.medicationNoticeTone ?? 'success';
  const resolvedMedicationNotice = routeMedicationNotice ?? medicationNotice;
  const resolvedMedicationNoticeTone = routeMedicationNotice
    ? routeMedicationNoticeTone
    : medicationNoticeTone;
  const canManageOrders = canManageMedicationOrders(session.user.role);
  const isStaffSession = isStaffRole(session.user.role);
  const [selectedResidentIds, setSelectedResidentIds] = useState<string[]>([]);

  const filteredMedications = useMemo(() => {
    if (selectedResidentIds.length === 0) {
      return medications;
    }

    return medications.filter((medication) =>
      selectedResidentIds.includes(medication.residentId),
    );
  }, [medications, selectedResidentIds]);

  const filteredActiveMedicationCount = useMemo(
    () => filteredMedications.filter((medication) => medication.active).length,
    [filteredMedications],
  );

  const selectedResidentOptions = useMemo(
    () =>
      residentOptions.filter((option) =>
        selectedResidentIds.includes(option.value),
      ),
    [residentOptions, selectedResidentIds],
  );

  const visibleMedicationCount = filteredMedications.length;
  const heroBadgeText = `${medicationCount} ordenes`;
  const filterSummary =
    selectedResidentOptions.length === 0
      ? 'Busca y selecciona uno o varios residentes para revisar su medicacion en conjunto.'
      : selectedResidentOptions.length === 1
        ? `Mostrando ${visibleMedicationCount} de ${medicationCount} ordenes para ${selectedResidentOptions[0].label}.`
        : `Mostrando ${visibleMedicationCount} de ${medicationCount} ordenes para ${selectedResidentOptions.length} pacientes seleccionados.`;

  useEffect(() => {
    if (!routeMedicationNotice) {
      return;
    }

    navigate(location.pathname, {
      replace: true,
      state: null,
    });
  }, [location.pathname, navigate, routeMedicationNotice]);

  return (
    <WorkspaceShell
      residentCount={residentCount}
      session={session}
      onLogout={onLogout}
    >
      <section className={`${shellCardClassName} grid gap-5 px-7 py-6`}>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="grid gap-2.5">
            <span className="inline-flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-primary">
              Medicacion
            </span>
            <h1 className="text-[clamp(2rem,3.2vw,2.6rem)] font-bold tracking-[-0.04em] text-brand-text">
              Agenda clinica de medicamentos
            </h1>
            <p className="max-w-[58ch] leading-[1.65] text-brand-text-secondary">
              {isStaffSession
                ? 'Revisa ordenes por residente y registra administraciones, omisiones o rechazos sin modificar la prescripcion.'
                : 'Gestiona ordenes por residente, revisa horarios, cambia estados y abre una subpagina dedicada para cargar o editar cada indicacion.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className={primaryButtonClassName}>{heroBadgeText}</span>
            {canManageOrders ? (
              <Link
                className={primaryButtonClassName}
                data-testid="medication-create-button"
                to="/medicacion/nueva"
              >
                Nueva orden
              </Link>
            ) : (
              <span className={primaryButtonClassName}>Registro operativo</span>
            )}
          </div>
        </div>
      </section>

      {resolvedMedicationNotice && (
        <section
          className={`${shellCardClassName} px-6 py-[22px] ${
            resolvedMedicationNoticeTone === 'error'
              ? 'border border-[rgba(168,43,17,0.16)] bg-[rgba(168,43,17,0.08)] text-[rgb(130,44,25)]'
              : 'border border-[rgba(0,102,132,0.14)] bg-[rgba(0,102,132,0.08)] text-brand-secondary'
          }`}
        >
          <span className="leading-[1.55]">{resolvedMedicationNotice}</span>
        </section>
      )}

      {screenState === 'loading' && (
        <StatusNotice message="Cargando medicacion y residentes de la sesion activa." />
      )}

      {screenState === 'error' && (
        <StatusNotice
          title="No pude cargar la medicacion."
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
        <MedicationOrdersPanel
          medications={filteredMedications}
          medicationExecutionsByMedicationId={
            medicationExecutionsByMedicationId
          }
          recordingMedicationExecutionId={recordingMedicationExecutionId}
          activeMedicationCount={
            selectedResidentIds.length > 0
              ? filteredActiveMedicationCount
              : activeMedicationCount
          }
          residentOptions={residentOptions}
          selectedResidentIds={selectedResidentIds}
          onSelectedResidentIdsChange={setSelectedResidentIds}
          onCreateMedicationExecution={onCreateMedicationExecution}
          canManageMedicationOrders={canManageOrders}
          filterSummary={filterSummary}
          isFiltered={selectedResidentIds.length > 0}
          emptyStateMessage={
            selectedResidentOptions.length === 1
              ? `No hay ordenes de medicacion para ${selectedResidentOptions[0].label}.`
              : selectedResidentOptions.length > 1
                ? 'No hay ordenes de medicacion para los pacientes seleccionados.'
                : 'Todavia no hay ordenes de medicacion cargadas.'
          }
        />
      )}
    </WorkspaceShell>
  );
}
