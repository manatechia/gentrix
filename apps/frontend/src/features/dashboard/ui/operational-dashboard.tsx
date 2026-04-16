import { useMemo, useState } from 'react';

import type {
  AuthSession,
  DashboardSnapshot,
  ResidentAgendaOccurrenceWithResident,
} from '@gentrix/shared-types';

import { OperationalHeader } from './operational-header';
import { PriorityTasksPanel } from './priority-tasks-panel';
import { QuickObservationModal } from './quick-observation-modal';
import { ResidentsUnderObservationPanel } from './residents-under-observation-panel';

interface OperationalDashboardProps {
  session: AuthSession;
  dashboard: DashboardSnapshot;
  upcomingAgendaOccurrences: ResidentAgendaOccurrenceWithResident[];
  onRefresh: () => void | Promise<void>;
}

const TASKS_ANCHOR_ID = 'priority-tasks-anchor';

/**
 * Variante del dashboard para roles operativos (asistente, enfermera).
 * Diseñada para escaneo rápido durante el turno: header con saludo y
 * turno, tareas agrupadas por urgencia, residentes en observación.
 */
export function OperationalDashboard({
  session,
  dashboard,
  upcomingAgendaOccurrences,
  onRefresh,
}: OperationalDashboardProps) {
  const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Un único timestamp por render. Si el usuario deja la pantalla abierta
  // mucho tiempo, el próximo refresh (manual o del modal) recalcula.
  const now = useMemo(() => new Date(), []);

  // Solo mostramos la columna derecha cuando hay algo que mirar: si el
  // equipo no tiene residentes en observación, no queremos ocupar espacio
  // con un estado vacío.
  const hasResidentsUnderObservation = useMemo(
    () => dashboard.residents.some((r) => r.careStatus === 'en_observacion'),
    [dashboard.residents],
  );

  const handleObservationSuccess = (message: string) => {
    setNotice(message);
    setIsObservationModalOpen(false);
    void onRefresh();
  };

  const handleJumpToTasks = () => {
    if (typeof document === 'undefined') return;
    const target = document.getElementById(TASKS_ANCHOR_ID);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div data-testid="dashboard-variant-operational" className="grid gap-[18px]">
      <OperationalHeader
        userFullName={session.user.fullName}
        now={now}
        onNewObservation={() => {
          setNotice(null);
          setIsObservationModalOpen(true);
        }}
        onJumpToTasks={handleJumpToTasks}
      />

      {notice && (
        <div
          data-testid="operational-dashboard-notice"
          className="rounded-[18px] border border-[rgba(0,102,132,0.14)] bg-[rgba(0,102,132,0.08)] px-4 py-3 text-brand-secondary"
        >
          {notice}
        </div>
      )}

      <section
        className={`grid gap-[18px] ${
          hasResidentsUnderObservation
            ? 'min-[1181px]:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]'
            : ''
        }`}
      >
        <PriorityTasksPanel
          occurrences={upcomingAgendaOccurrences}
          now={now}
          anchorId={TASKS_ANCHOR_ID}
        />
        {hasResidentsUnderObservation && (
          <ResidentsUnderObservationPanel residents={dashboard.residents} />
        )}
      </section>

      {isObservationModalOpen && (
        <QuickObservationModal
          residents={dashboard.residents}
          onClose={() => setIsObservationModalOpen(false)}
          onSuccess={handleObservationSuccess}
        />
      )}
    </div>
  );
}
