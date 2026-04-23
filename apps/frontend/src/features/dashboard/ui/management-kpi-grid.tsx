import type { DashboardSnapshot } from '@gentrix/shared-types';

type Semaphore = 'good' | 'attention' | 'critical' | 'neutral';
type Tone = 'teal' | 'violet' | Semaphore;

interface ManagementKpi {
  id: string;
  label: string;
  value: string | number;
  helper: string;
  semaphore: Semaphore;
  tone: Tone;
  testId: string;
}

const TONE_STYLES: Record<Tone, string> = {
  good: 'border-l-[rgb(25,95,70)] bg-[rgba(34,124,94,0.14)]',
  attention: 'border-l-[rgb(150,90,10)] bg-[rgba(212,140,18,0.18)]',
  critical: 'border-l-[rgb(168,43,17)] bg-[rgba(168,43,17,0.14)]',
  neutral: 'border-l-[rgba(0,102,132,0.35)] bg-[rgba(0,102,132,0.08)]',
  teal: 'border-l-[rgb(0,120,148)] bg-[rgba(0,120,148,0.14)]',
  violet: 'border-l-[rgb(108,86,168)] bg-[rgba(108,86,168,0.14)]',
};

const TONE_DOT: Record<Tone, string> = {
  good: 'bg-[rgb(25,95,70)]',
  attention: 'bg-[rgb(150,90,10)]',
  critical: 'bg-[rgb(168,43,17)]',
  neutral: 'bg-brand-primary',
  teal: 'bg-[rgb(0,120,148)]',
  violet: 'bg-[rgb(108,86,168)]',
};

const TONE_LABEL: Record<Tone, string> = {
  good: 'text-[rgb(25,95,70)]',
  attention: 'text-[rgb(150,90,10)]',
  critical: 'text-[rgb(130,44,25)]',
  neutral: 'text-brand-primary',
  teal: 'text-[rgb(0,120,148)]',
  violet: 'text-[rgb(92,72,150)]',
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

  const occupancySemaphore = classifyOccupancy(dashboard.summary.occupancyRate);
  const observationSemaphore = classifyObservationCount(inObservation);

  return [
    {
      id: 'residents-total',
      label: 'Residentes',
      value: dashboard.summary.residentCount,
      helper: 'total activos',
      semaphore: 'neutral',
      tone: 'teal',
      testId: 'management-kpi-residents-total',
    },
    {
      id: 'occupancy',
      label: 'Ocupación',
      value: `${dashboard.summary.occupancyRate}%`,
      helper: 'general',
      semaphore: occupancySemaphore,
      tone: occupancySemaphore,
      testId: 'management-kpi-occupancy',
    },
    {
      id: 'in-observation',
      label: 'En observación',
      value: inObservation,
      helper: inObservation === 1 ? 'residente' : 'residentes',
      semaphore: observationSemaphore,
      tone: observationSemaphore,
      testId: 'management-kpi-in-observation',
    },
    {
      id: 'staff-on-duty',
      label: 'Personal en turno',
      value: dashboard.summary.teamOnDuty,
      helper: 'activos',
      semaphore: 'neutral',
      tone: 'violet',
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
      className="grid grid-cols-2 gap-2 sm:gap-3 min-[1100px]:grid-cols-4"
    >
      {kpis.map((kpi) => (
        <article
          key={kpi.id}
          data-testid={kpi.testId}
          className={`grid gap-0.5 rounded-2xl border border-[rgba(0,102,132,0.08)] border-l-4 px-3 py-2 shadow-panel backdrop-blur-sm sm:gap-1 sm:rounded-[22px] sm:px-4 sm:py-3 ${TONE_STYLES[kpi.tone]}`}
        >
          <span className={`flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.1em] sm:gap-2 sm:text-[0.72rem] sm:tracking-[0.14em] ${TONE_LABEL[kpi.tone]}`}>
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2 ${TONE_DOT[kpi.tone]}`}
              aria-hidden="true"
            />
            {kpi.label}
          </span>
          <strong className="text-[1.25rem] font-bold leading-none tracking-[-0.02em] text-brand-text sm:text-[1.75rem]">
            {kpi.value}
          </strong>
          <span className="text-[0.72rem] text-brand-text-secondary sm:text-[0.82rem]">
            {kpi.helper}
          </span>
        </article>
      ))}
    </section>
  );
}
