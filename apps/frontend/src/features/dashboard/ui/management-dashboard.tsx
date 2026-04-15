import { useMemo } from 'react';

import type {
  DashboardSnapshot,
  ResidentAgendaOccurrenceWithResident,
} from '@gentrix/shared-types';

import { CriticalTasksPanel } from './critical-tasks-panel';
import { ManagementKpiGrid } from './management-kpi-grid';
import { ResidentsUnderObservationPanel } from './residents-under-observation-panel';
import { ShiftCoveragePanel } from './shift-coverage-panel';

interface ManagementDashboardProps {
  dashboard: DashboardSnapshot;
  upcomingAgendaOccurrences: ResidentAgendaOccurrenceWithResident[];
}

/**
 * Variante del dashboard para roles de gestión (admin y derivados).
 *
 * Layout:
 *  1. KPIs compactos con semáforo (residentes, ocupación, en observación, personal).
 *  2. Residentes en observación + Tareas críticas (vencidas + med/médico próximos).
 *  3. Cobertura del turno agrupada por sector.
 *
 * NO incluido (requiere extender el modelo de datos):
 *  - "Habitaciones disponibles" (falta capacidad total de la residencia).
 *  - "Incidentes del día" (módulo de alertas desactivado).
 *  - "Motivo / prioridad" de residentes en observación (no existe en overview).
 *  - "Faltantes de personal" (no hay target de cobertura vs actual).
 *  - "Cumpleaños", "ingresos/altas" (birthDate/admissionDate no están en ResidentOverview).
 */
export function ManagementDashboard({
  dashboard,
  upcomingAgendaOccurrences,
}: ManagementDashboardProps) {
  const now = useMemo(() => new Date(), []);

  return (
    <div data-testid="dashboard-variant-management" className="grid gap-[18px]">
      <ManagementKpiGrid dashboard={dashboard} />

      <section className="grid gap-[18px] min-[1181px]:grid-cols-[minmax(320px,1fr)_minmax(320px,1.3fr)]">
        <ResidentsUnderObservationPanel residents={dashboard.residents} />
        <CriticalTasksPanel
          occurrences={upcomingAgendaOccurrences}
          now={now}
        />
      </section>

      <ShiftCoveragePanel staff={dashboard.staff} />
    </div>
  );
}
