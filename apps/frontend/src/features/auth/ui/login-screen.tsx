import { Formik } from 'formik';

import type { AuthLoginRequest } from '@gentrix/shared-types';

import {
  demoAccessOptions,
  demoCredentials,
} from '../constants/demo-credentials';
import { loginFormSchema } from '../schemas/login-form.schema';
import {
  inputClassName,
  secondaryButtonClassName,
} from '../../../shared/ui/class-names';

interface LoginScreenProps {
  isCheckingSession: boolean;
  authError: string | null;
  isSubmitting: boolean;
  onSubmit: (values: AuthLoginRequest) => Promise<void>;
  onClearError: () => void;
}

export function LoginScreen({
  isCheckingSession,
  authError,
  isSubmitting,
  onSubmit,
  onClearError,
}: LoginScreenProps) {
  return (
    <main
      className="flex min-h-screen items-center justify-center p-7 text-brand-text"
      data-testid="login-screen"
    >
      <section className="grid min-h-[calc(100vh-56px)] w-full max-w-[1360px] overflow-hidden rounded-[32px] border border-[rgba(0,102,132,0.08)] bg-white/92 shadow-[0_28px_70px_rgba(24,52,61,0.18)] lg:grid-cols-[minmax(0,0.96fr)_minmax(460px,0.84fr)]">
        <article className="relative isolate flex flex-col justify-between overflow-hidden bg-[linear-gradient(180deg,rgba(0,102,132,0.72),rgba(47,79,79,0.82)),radial-gradient(circle_at_top_left,rgba(160,220,233,0.3),transparent_28%),linear-gradient(140deg,#3b7a8c_0%,#2f6b76_42%,#294f52_100%)] p-9 text-white max-lg:min-h-[420px] max-sm:p-6">
          <div className="relative z-10 flex items-center gap-3.5">
            <div className="grid h-[46px] w-[46px] place-items-center rounded-[14px] bg-[linear-gradient(180deg,#def6fb,#b7e7f0)] font-bold text-brand-secondary shadow-[0_12px_24px_rgba(5,31,34,0.2)]">
              G
            </div>
            <div>
              <strong className="block text-2xl font-bold tracking-[-0.03em]">
                Gentrix MVP
              </strong>
              <span className="mt-1 block text-[0.72rem] uppercase tracking-[0.22em] text-white/72">
                OPERACION CENTRALIZADA
              </span>
            </div>
          </div>

          <div className="relative z-10 mt-auto max-w-[460px]">
            <span className="inline-flex items-center rounded-full border border-white/16 bg-white/14 px-3.5 py-2 text-[0.74rem] uppercase tracking-[0.18em] text-white/88">
              Nuestra mision
            </span>
            <h1 className="mt-6 text-[clamp(3rem,4.8vw,4.9rem)] leading-[0.93] font-bold tracking-[-0.05em]">
              Dignidad en cada detalle.
            </h1>
            <p className="mt-3 max-w-[34ch] text-[1.03rem] leading-[1.65] text-white/82">
              Operacion clinica, seguimiento residencial y decisiones del turno
              en un solo lugar.
            </p>
            <div className="mt-7 h-1 w-[82px] rounded-full bg-white/62" />
          </div>

          <div className="relative z-10 mt-10 flex items-center gap-3.5 max-sm:hidden">
            <div className="flex items-center">
              <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-white/90 bg-[linear-gradient(180deg,#fef8ef,#d9f0f4)] text-[0.78rem] font-semibold text-brand-secondary shadow-[0_10px_18px_rgba(5,31,34,0.18)]">
                SG
              </span>
              <span className="-ml-2 grid h-10 w-10 place-items-center rounded-full border-2 border-white/90 bg-[linear-gradient(180deg,#fef8ef,#d9f0f4)] text-[0.78rem] font-semibold text-brand-secondary shadow-[0_10px_18px_rgba(5,31,34,0.18)]">
                MR
              </span>
              <span className="-ml-2 inline-grid h-10 min-w-12 place-items-center rounded-full border-2 border-white/90 bg-brand-primary px-3.5 text-[0.78rem] font-semibold text-white shadow-[0_10px_18px_rgba(5,31,34,0.18)]">
                12k
              </span>
            </div>
            <span className="text-[0.95rem] text-white/78">
              Pensado para equipos de cuidado en Argentina
            </span>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[28%] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(10,20,22,0.14)),repeating-linear-gradient(90deg,rgba(234,239,239,0.34)_0,rgba(234,239,239,0.34)_9%,rgba(207,216,216,0.42)_9%,rgba(207,216,216,0.42)_18%)]" />
          <div className="pointer-events-none absolute bottom-[12%] left-[-10%] right-[22%] h-[38%] bg-[radial-gradient(circle,rgba(194,241,248,0.26),transparent_62%)] blur-xl" />
        </article>

        <article className="flex flex-col justify-between gap-6 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),#fdfefe)] px-11 py-10 max-sm:px-6 max-sm:py-7">
          <div className="mx-auto grid w-full max-w-[420px] gap-6">
            <div className="grid gap-3.5">
              <div>
                <span className="inline-flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-primary">
                  Acceso seguro
                </span>
                <h2 className="mt-1 text-[clamp(2rem,3.4vw,2.45rem)] font-bold tracking-[-0.04em]">
                  Ingresar al sistema
                </h2>
              </div>
              <p className="m-0 leading-[1.65] text-brand-text-secondary">
                Ingresa tus credenciales para entrar a la consola operativa.
              </p>
            </div>

            {isCheckingSession && (
              <div className="rounded-[18px] border border-[rgba(0,102,132,0.14)] bg-[rgba(0,102,132,0.08)] px-4 py-3.5 text-[0.95rem] leading-[1.55] text-brand-secondary">
                Verificando sesion previa antes de mostrar el formulario.
              </div>
            )}

            {authError && (
              <div className="rounded-[18px] border border-[rgba(196,48,48,0.16)] bg-[rgba(196,48,48,0.08)] px-4 py-3.5 text-[0.95rem] leading-[1.55] text-[#972f2f]">
                {authError}
              </div>
            )}

            <Formik<AuthLoginRequest>
              initialValues={demoCredentials}
              validationSchema={loginFormSchema}
              onSubmit={async (values) => {
                onClearError();
                await onSubmit(values);
              }}
            >
              {({
                errors,
                handleBlur,
                handleChange,
                handleSubmit,
                setValues,
                touched,
                values,
              }) => {
                const selectedAccessId =
                  demoAccessOptions.find(
                    (option) =>
                      option.credentials.email === values.email &&
                      option.credentials.password === values.password,
                  )?.id ?? null;

                return (
                  <form className="grid gap-[18px]" onSubmit={handleSubmit}>
                    <div className="grid gap-3">
                      <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                        Accesos demo
                      </span>
                      <div className="grid gap-3">
                        {demoAccessOptions.map((option) => {
                          const isSelected = option.id === selectedAccessId;

                          return (
                            <button
                              key={option.id}
                              className={`grid gap-2 rounded-[22px] border px-4 py-4 text-left transition ${
                                isSelected
                                  ? 'border-[rgba(0,102,132,0.22)] bg-[rgba(0,102,132,0.08)] shadow-[0_18px_36px_rgba(0,102,132,0.08)]'
                                  : 'border-[rgba(0,102,132,0.08)] bg-brand-neutral/45 hover:border-[rgba(0,102,132,0.16)] hover:bg-white'
                              }`}
                              type="button"
                              onClick={() => {
                                onClearError();
                                setValues(option.credentials);
                              }}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="grid gap-1">
                                  <strong className="text-brand-text">
                                    {option.label}
                                  </strong>
                                  <span className="leading-[1.55] text-brand-text-secondary">
                                    {option.description}
                                  </span>
                                </div>
                                <span className="rounded-full bg-brand-primary/10 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-brand-primary">
                                  {isSelected ? 'Activo' : 'Demo'}
                                </span>
                              </div>
                              <span className="text-[0.9rem] leading-[1.55] text-brand-text-secondary">
                                {option.capabilities}
                              </span>
                              <div className="grid gap-1 text-[0.9rem] text-brand-secondary">
                                <code>{option.credentials.email}</code>
                                <code>{option.credentials.password}</code>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <label className="grid gap-2.5">
                      <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                        Correo electronico
                      </span>
                      <input
                        data-testid="login-email-input"
                        className={inputClassName}
                        type="email"
                        autoComplete="username"
                        name="email"
                        placeholder="admin@residencia.com.ar"
                        value={values.email}
                        onBlur={handleBlur}
                        onChange={handleChange}
                      />
                      {touched.email && errors.email && (
                        <span className="text-[0.85rem] text-[#972f2f]">
                          {errors.email}
                        </span>
                      )}
                    </label>

                    <label className="grid gap-2.5">
                      <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                        Contrasena
                      </span>
                      <input
                        data-testid="login-password-input"
                        className={inputClassName}
                        type="password"
                        autoComplete="current-password"
                        name="password"
                        placeholder="Ingresa tu contrasena"
                        value={values.password}
                        onBlur={handleBlur}
                        onChange={handleChange}
                      />
                      {touched.password && errors.password && (
                        <span className="text-[0.85rem] text-[#972f2f]">
                          {errors.password}
                        </span>
                      )}
                    </label>

                    <div className="flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-start">
                      <label className="inline-flex items-center gap-2.5 text-[0.94rem] text-brand-text-secondary">
                        <input
                          className="h-4 w-4 accent-brand-primary"
                          type="checkbox"
                        />
                        <span>Recordarme</span>
                      </label>
                      <button
                        className="border-0 bg-transparent p-0 font-semibold text-brand-primary"
                        type="button"
                      >
                        Olvide mi contrasena
                      </button>
                    </div>

                    <button
                      data-testid="login-submit-button"
                      className="inline-flex min-h-[54px] items-center justify-center rounded-2xl bg-brand-primary px-4 text-white font-semibold shadow-brand transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                      type="submit"
                      disabled={isSubmitting || isCheckingSession}
                    >
                      {isSubmitting ? 'Ingresando...' : 'Ingresar'}
                    </button>

                    <button
                      data-testid="login-demo-button"
                      className={`${secondaryButtonClassName} mt-2`}
                      type="button"
                      onClick={() => {
                        onClearError();
                        setValues(demoAccessOptions[0].credentials);
                      }}
                    >
                      Cargar acceso administrador
                    </button>
                  </form>
                );
              }}
            </Formik>

            <div className="grid gap-3.5 rounded-[22px] border border-[rgba(0,102,132,0.08)] bg-[linear-gradient(180deg,rgba(245,247,247,0.88),#fff)] p-[18px] shadow-panel">
              <div>
                <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-primary">
                  Diferencias por rol
                </span>
                <p className="mt-2 leading-[1.6] text-brand-text-secondary">
                  Administracion conserva altas y ediciones maestras. Personal
                  entra a la vista operativa y solo registra ejecuciones de
                  medicacion.
                </p>
              </div>
              <div>
                <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-primary">
                  Acceso por defecto
                </span>
                <code className="mt-1 block font-mono text-brand-secondary">
                  {demoCredentials.email}
                </code>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-between gap-3 text-[0.78rem] uppercase tracking-[0.06em] text-brand-text-muted max-sm:flex-col">
            <span>Terminos y privacidad</span>
            <span>Estado del sistema: optimo</span>
            <span>Conexion segura activa</span>
          </div>
        </article>
      </section>
    </main>
  );
}
