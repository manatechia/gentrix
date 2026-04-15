interface OperationalKpi {
  id: string;
  label: string;
  value: number;
  helper: string;
  testId: string;
}

interface OperationalKpiGridProps {
  kpis: OperationalKpi[];
}

/**
 * 4 tarjetas compactas con números del turno. Diseñadas para escanear
 * rápido — bajo contraste, tipografía grande para el número, una línea
 * de helper con contexto.
 */
export function OperationalKpiGrid({ kpis }: OperationalKpiGridProps) {
  return (
    <section
      data-testid="operational-kpi-grid"
      className="grid gap-3 sm:grid-cols-2 min-[1100px]:grid-cols-4"
    >
      {kpis.map((kpi) => (
        <article
          key={kpi.id}
          data-testid={kpi.testId}
          className="grid gap-1 rounded-[22px] border border-[rgba(0,102,132,0.08)] bg-white/92 px-4 py-3 shadow-panel backdrop-blur-sm"
        >
          <span className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-brand-primary">
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

export type { OperationalKpi };
