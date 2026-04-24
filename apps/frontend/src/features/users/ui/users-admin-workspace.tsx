import { useState } from 'react';

import type {
  AuthSession,
  PasswordResetResponse,
  UserCreateRole,
  UserCreateInput,
  UserOverview,
} from '@gentrix/shared-types';

import {
  formatAuthRole,
  formatEntityStatus,
} from '../../../shared/lib/display-labels';
import {
  badgeBaseClassName,
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  surfaceCardClassName,
} from '../../../shared/ui/class-names';
import { SelectField } from '../../../shared/ui/select-field';
import { WorkspaceShell } from '../../dashboard/ui/workspace-shell';
import { StatusNotice } from '../../dashboard/ui/status-notice';
import type { DashboardScreenState } from '../../dashboard/types/dashboard-screen-state';

interface UsersAdminWorkspaceProps {
  screenState: DashboardScreenState;
  session: AuthSession;
  residentCount: number;
  users: UserOverview[];
  usersError: string | null;
  isSavingUser: boolean;
  resettingUserId: string | null;
  lastResetResult: PasswordResetResponse | null;
  userNotice: string | null;
  userNoticeTone: 'success' | 'error';
  onUserCreate: (input: UserCreateInput) => Promise<UserOverview | null>;
  onPasswordReset: (userId: string) => Promise<PasswordResetResponse | null>;
  onClearResetResult: () => void;
  onLogout: () => void | Promise<void>;
  onRetry: () => void | Promise<void>;
}

interface UserFormState {
  fullName: string;
  email: string;
  role: UserCreateRole;
  password: string;
}

const roleOptions: Array<{ value: UserCreateRole; label: string }> = [
  { value: 'nurse', label: 'Enfermeras/os' },
  { value: 'assistant', label: 'Asistentes' },
  { value: 'health-director', label: 'Director de salud' },
  { value: 'external', label: 'Externos' },
];

function createInitialUserFormState(): UserFormState {
  return {
    fullName: '',
    email: '',
    role: 'assistant',
    password: '',
  };
}

export function UsersAdminWorkspace({
  screenState,
  session,
  residentCount,
  users,
  usersError,
  isSavingUser,
  resettingUserId,
  lastResetResult,
  userNotice,
  userNoticeTone,
  onUserCreate,
  onPasswordReset,
  onClearResetResult,
  onLogout,
  onRetry,
}: UsersAdminWorkspaceProps) {
  const visibleUsers = users.filter((user) => user.role !== 'admin');
  const [formState, setFormState] = useState<UserFormState>(
    createInitialUserFormState,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingResetUser, setPendingResetUser] = useState<UserOverview | null>(
    null,
  );
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  async function handleResetConfirmed(userId: string): Promise<void> {
    const result = await onPasswordReset(userId);
    setPendingResetUser(null);
    // The temporary password is rendered once by the notice; we don't need
    // additional state here, but keep a local copy-feedback flag clean.
    if (result) {
      setCopyFeedback(null);
    }
  }

  async function handleCopyTemporaryPassword(password: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(password);
      setCopyFeedback('Copiada al portapapeles.');
    } catch {
      setCopyFeedback('No se pudo copiarla automáticamente. Copiala manualmente.');
    }
  }

  async function handleSubmit(): Promise<void> {
    const fullName = formState.fullName.trim();
    const email = formState.email.trim().toLowerCase();
    const password = formState.password.trim();

    if (!fullName) {
      setFormError('El nombre completo es obligatorio.');
      return;
    }

    if (!email) {
      setFormError('El email es obligatorio.');
      return;
    }

    if (!password) {
      setFormError('La contrasena es obligatoria.');
      return;
    }

    setFormError(null);
    const createdUser = await onUserCreate({
      fullName,
      email,
      role: formState.role,
      password,
    });

    if (!createdUser) {
      return;
    }

    setFormState(createInitialUserFormState());
  }

  return (
    <WorkspaceShell
      residentCount={residentCount}
      session={session}
      onLogout={onLogout}
    >
      {(userNotice || formError) && (
        <section
          className={`rounded-[28px] px-6 py-[22px] shadow-panel ${
            formError || userNoticeTone === 'error'
              ? 'border border-[rgba(168,43,17,0.16)] bg-[rgba(168,43,17,0.08)] text-[rgb(130,44,25)]'
              : 'border border-[rgba(0,102,132,0.14)] bg-[rgba(0,102,132,0.08)] text-brand-secondary'
          }`}
        >
          <span className="leading-[1.55]">{formError ?? userNotice}</span>
        </section>
      )}

      {screenState === 'loading' && (
        <StatusNotice message="Cargando usuarios de la organizacion activa." />
      )}

      {screenState === 'error' && (
        <StatusNotice
          title="No se pudo cargar los usuarios."
          message={usersError ?? 'Ocurrió un error inesperado.'}
          actions={[
            {
              label: 'Reintentar',
              onClick: onRetry,
            },
            {
              label: 'Cerrar sesión',
              onClick: onLogout,
              variant: 'secondary',
            },
          ]}
        />
      )}

      {screenState === 'ready' && (
        <section
          className="grid gap-[18px] min-[1080px]:grid-cols-[minmax(320px,0.88fr)_minmax(0,1.12fr)]"
          data-testid="users-admin-workspace"
        >
          <article className={surfaceCardClassName}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="grid gap-1.5">
                <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                  Alta rapida
                </span>
                <h2 className="text-[1.2rem] font-bold tracking-[-0.04em] text-brand-text">
                  Nuevo usuario
                </h2>
              </div>
              <span className={secondaryButtonClassName}>Email + password</span>
            </div>

            <div className="mt-4 grid gap-[14px]">
              <label className="grid gap-2.5">
                <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                  Nombre completo
                </span>
                <input
                  data-testid="users-form-full-name-input"
                  className={inputClassName}
                  type="text"
                  value={formState.fullName}
                  onChange={(event) => {
                    setFormState((current) => ({
                      ...current,
                      fullName: event.target.value,
                    }));
                  }}
                />
              </label>

              <label className="grid gap-2.5">
                <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                  Email
                </span>
                <input
                  data-testid="users-form-email-input"
                  className={inputClassName}
                  type="email"
                  value={formState.email}
                  onChange={(event) => {
                    setFormState((current) => ({
                      ...current,
                      email: event.target.value,
                    }));
                  }}
                />
              </label>

              <label className="grid gap-2.5">
                <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                  Rol
                </span>
                <SelectField
                  name="users.role"
                  testId="users-form-role-select"
                  value={formState.role}
                  options={roleOptions}
                  onChange={(nextValue) => {
                    setFormState((current) => ({
                      ...current,
                      role: nextValue as UserCreateRole,
                    }));
                  }}
                />
              </label>

              <label className="grid gap-2.5">
                <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                  Contrasena
                </span>
                <input
                  data-testid="users-form-password-input"
                  className={inputClassName}
                  type="text"
                  value={formState.password}
                  onChange={(event) => {
                    setFormState((current) => ({
                      ...current,
                      password: event.target.value,
                    }));
                  }}
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                data-testid="users-form-submit-button"
                className={primaryButtonClassName}
                type="button"
                disabled={isSavingUser}
                onClick={() => {
                  void handleSubmit();
                }}
              >
                {isSavingUser ? 'Guardando...' : 'Crear usuario'}
              </button>
            </div>
          </article>

          <article className={surfaceCardClassName}>
            <div className="mb-[18px] flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                  Accesos activos
                </span>
                <h2 className="mt-1 text-[1.2rem] font-bold tracking-[-0.04em] text-brand-text">
                  Listado de usuarios
                </h2>
              </div>
              <span
                className={`${badgeBaseClassName} bg-brand-secondary/12 text-brand-secondary`}
              >
                Organizacion actual
              </span>
            </div>

            <div className="grid gap-3">
              {visibleUsers.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-[rgba(0,102,132,0.22)] bg-brand-neutral px-4 py-5 text-brand-text-secondary">
                  No hay usuarios cargados todavia.
                </div>
              ) : (
                visibleUsers.map((user) => (
                  <article
                    key={user.id}
                    data-testid={`user-row-${user.id}`}
                    className="grid gap-2 rounded-[22px] border border-[rgba(0,102,132,0.08)] bg-brand-neutral px-4 py-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <strong className="text-brand-text">{user.fullName}</strong>
                      <span
                        className={`${badgeBaseClassName} bg-brand-primary/12 text-brand-primary`}
                      >
                        {formatAuthRole(user.role)}
                      </span>
                    </div>
                    <span className="text-brand-text-secondary">{user.email}</span>
                    <span className="text-[0.9rem] text-brand-text-muted">
                      Estado: {formatEntityStatus(user.status)}
                    </span>
                    {user.forcePasswordChange && (
                      <span
                        className={`${badgeBaseClassName} w-max bg-[rgba(168,108,17,0.12)] text-[rgb(130,77,25)]`}
                        data-testid={`user-row-${user.id}-force-flag`}
                      >
                        Pendiente de cambio de contraseña
                      </span>
                    )}
                    <div className="mt-1 flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        data-testid={`user-row-${user.id}-reset-button`}
                        className={secondaryButtonClassName}
                        disabled={resettingUserId === user.id}
                        onClick={() => {
                          setPendingResetUser(user);
                          setCopyFeedback(null);
                          onClearResetResult();
                        }}
                      >
                        {resettingUserId === user.id
                          ? 'Reiniciando…'
                          : 'Reiniciar contraseña'}
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </article>
        </section>
      )}

      {pendingResetUser && (
        <div
          role="dialog"
          aria-modal="true"
          data-testid="users-reset-confirm-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(9,16,28,0.55)] px-4"
        >
          <div className="grid w-full max-w-[440px] gap-4 rounded-[28px] bg-white px-6 py-6 shadow-panel">
            <h3 className="text-[1.2rem] font-bold tracking-[-0.03em] text-brand-text">
              ¿Reiniciar la contraseña de {pendingResetUser.fullName}?
            </h3>
            <p className="text-brand-text-secondary">
              Se generará una contraseña temporal. El usuario deberá
              establecer una nueva al iniciar sesión.
            </p>
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                className={secondaryButtonClassName}
                onClick={() => setPendingResetUser(null)}
                disabled={resettingUserId === pendingResetUser.id}
              >
                Cancelar
              </button>
              <button
                type="button"
                data-testid="users-reset-confirm-button"
                className={primaryButtonClassName}
                disabled={resettingUserId === pendingResetUser.id}
                onClick={() => {
                  void handleResetConfirmed(pendingResetUser.id);
                }}
              >
                {resettingUserId === pendingResetUser.id
                  ? 'Reiniciando…'
                  : 'Confirmar reinicio'}
              </button>
            </div>
          </div>
        </div>
      )}

      {lastResetResult && (
        <div
          role="dialog"
          aria-modal="true"
          data-testid="users-reset-result-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(9,16,28,0.55)] px-4"
        >
          <div className="grid w-full max-w-[480px] gap-4 rounded-[28px] bg-white px-6 py-6 shadow-panel">
            <h3 className="text-[1.2rem] font-bold tracking-[-0.03em] text-brand-text">
              Contraseña temporal generada
            </h3>
            <p className="text-brand-text-secondary">
              Compártala con el usuario por un canal seguro. Sólo podrá verla
              ahora. Deberá cambiarla al iniciar sesión.
            </p>
            <code
              data-testid="users-reset-temporary-password"
              className="rounded-[16px] bg-brand-neutral px-4 py-3 text-[1.05rem] tracking-[0.06em] text-brand-text"
            >
              {lastResetResult.temporaryPassword}
            </code>
            {copyFeedback && (
              <span className="text-[0.9rem] text-brand-text-muted">
                {copyFeedback}
              </span>
            )}
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                className={secondaryButtonClassName}
                onClick={() => {
                  void handleCopyTemporaryPassword(
                    lastResetResult.temporaryPassword,
                  );
                }}
              >
                Copiar
              </button>
              <button
                type="button"
                className={primaryButtonClassName}
                onClick={() => {
                  setCopyFeedback(null);
                  onClearResetResult();
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </WorkspaceShell>
  );
}
