import type { DashboardSnapshot } from '@gentrix/shared-types';

type Semaphore = 'good' | 'attention' | 'critical' | 'neutral';

interface ManagementKpi {
  id: string;
  label: string;
  value: string | number;
  helper: string;
  semaphore: Semaphore;
  testId: string;
}

const SEMAPHORE_STYLES: Record<Semaphore, string> = {
  good: 'border-l-[rgb(25,95,70)] bg-[rgba(34,124,94,0.06)]',
  attention:
    'border-l-[rgb(150,90,10)] bg-[rgba(212,140,18,0.06)]',
  critical:
    'border-l-[rgb(168,43,17)] bg-[rgba(168,43,17,0.06)]',
  neutral: 'border-l-[rgba(0,102,132,0.25)] bg-white/92',
};

const SEMAPHORE_DOT: Record<Semaphore, string> = {
  good: 'bg-[rgb(25,95,70)]',
  attention: 'bg-[rgb(150,90,10)]',
  critical: 'bg-[rgb(168,43,17)]',
  neutral: 'bg-brand-primary',
};

function classifyOccupancy(rate: number): Semaphore {
  if (rate >= 90) return 'critical';
  if (rate >= 70) return 'attention';
  return 'good';
}

function classifyObservationCount(count: number): Semaphore {
  if (count === 0) return 'good';
  if (count <= 2) return 'attention';
  return 'critical';
}

function buildKpis(dashboard: DashboardSnapshot): ManagementKpi[] {
  const inObservation = dashboard.residents.filter(
    (resident) => resident.careStatus === 'en_observacion',
  ).length;

  return [
    {
      id: 'residents-total',
      label: 'Residentes',
      value: dashboard.summary.residentCount,
      helper: 'total activos',
      semaphore: 'neutral',
      testId: 'management-kpi-residents-total',
    },
    {
      id: 'occupancy',
      label: 'Ocupación',
      value: `${dashboard.summary.occupancyRate}%`,
      helper: 'general',
      semaphore: classifyOccupancy(dashboard.summary.occupancyRate),
      testId: 'management-kpi-occupancy',
    },
    {
      id: 'in-observation',
      label: 'En observación',
      value: inObservation,
      helper: inObservation === 1 ? 'residente' : 'residentes',
      semaphore: classifyObservationCount(inObservation),
      testId: 'management-kpi-in-observation',
    },
    {
      id: 'staff-on-duty',
      label: 'Personal en turno',
      value: dashboard.summary.staffOnDuty,
      helper: 'activos',
      semaphore: 'neutral',
      testId: 'management-kpi-staff-on-duty',
    },
  ];
}

interface ManagementKpiGridProps {
  dashboard: DashboardSnapshot;
}

export function ManagementKpiGrid({ dashboard }: ManagementKpiGridProps) {
  const kpis = buildKpis(dashboard);

  return (
    <section
      data-testid="management-kpi-grid"
      className="grid gap-3 sm:grid-cols-2 min-[1100px]:grid-cols-4"
    >
      {kpis.map((kpi) => (
        <article
          key={kpi.id}
          data-testid={kpi.testId}
          className={`grid gap-1 rounded-[22px] border border-[rgba(0,102,132,0.08)] border-l-4 px-4 py-3 shadow-panel backdrop-blur-sm ${SEMAPHORE_STYLES[kpi.semaphore]}`}
        >
          <span className="flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-brand-primary">
            <span
              className={`inline-block h-2 w-2 rounded-full ${SEMAPHORE_DOT[kpi.semaphore]}`}
              aria-hidden="true"
            />
            {kpi.label}
          </span>
          <strong className="text-[1.75rem] font-bold leading-none tracking-[-0.02em] text-brand-text">
            {kpi.value}
          </strong>
          <span className="text-[0.82rem] text-brand-text-secondary">
            {kpi.helper}
          </span>
        </article>
      ))}
    </section>
  );
}
