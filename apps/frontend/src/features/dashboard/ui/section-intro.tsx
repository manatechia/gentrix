import { shellCardClassName } from '../../../shared/ui/class-names';

export function SectionIntro() {
  return (
    <section className={`${shellCardClassName} grid gap-2.5 px-7 py-6`}>
      <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-primary">
        Estructura del MVP
      </span>
      <h2 className="text-[clamp(1.55rem,2.5vw,2rem)] font-bold tracking-[-0.04em] text-brand-text">
        Plan de vistas
      </h2>
      <p className="leading-[1.65] text-brand-text-secondary">
        Login separado y despues una home operativa con sidebar. La gestion de
        residentes queda apartada en su propia ruta para no mezclar altas con
        el seguimiento diario del turno.
      </p>
    </section>
  );
}
