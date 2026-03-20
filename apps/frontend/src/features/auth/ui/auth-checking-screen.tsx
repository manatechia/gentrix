import { shellCardClassName } from '../../../shared/ui/class-names';

export function AuthCheckingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center p-7 text-brand-text">
      <section
        className={`${shellCardClassName} grid w-full max-w-[620px] gap-5 px-8 py-10 text-center`}
      >
        <span className="inline-flex justify-center text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-primary">
          Restaurando sesion
        </span>
        <h1 className="text-[clamp(2rem,3vw,2.6rem)] font-bold tracking-[-0.04em]">
          Recuperando tu sesion
        </h1>
        <p className="mx-auto max-w-[42ch] leading-[1.7] text-brand-text-secondary">
          Estamos validando la sesion activa antes de mostrar el tablero.
        </p>
        <div className="mx-auto h-2.5 w-full max-w-[260px] overflow-hidden rounded-full bg-brand-primary/10">
          <div className="h-full w-1/3 rounded-full bg-brand-primary motion-safe:animate-pulse" />
        </div>
      </section>
    </main>
  );
}
