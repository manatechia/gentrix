import { shellCardClassName } from '../../../shared/ui/class-names';

export function DashboardHeader() {
  return (
    <section className={`${shellCardClassName} p-7`}>
      <span className="inline-flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-primary">
        Operacion central
      </span>
      <h1 className="mt-2 text-[clamp(2.1rem,3.5vw,2.8rem)] font-bold tracking-[-0.04em] text-brand-text">
        Consola operativa Gentrix
      </h1>
      <p className="mt-3 max-w-[58ch] leading-[1.65] text-brand-text-secondary">
        La home concentra la operacion diaria: turnos, medicacion, alertas y
        lectura general del estado de la residencia.
      </p>
    </section>
  );
}
