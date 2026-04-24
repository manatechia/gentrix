import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import type {
  AuthSession,
  PasswordResetResponse,
  UserCreateInput,
  UserOverview,
} from '@gentrix/shared-types';

import {
  primaryButtonClassName,
  secondaryButtonClassName,
  surfaceCardClassName,
} from '../../../shared/ui/class-names';
import { WorkspaceShell } from '../../dashboard/ui/workspace-shell';
import { StatusNotice } from '../../dashboard/ui/status-notice';
import type { DashboardScreenState } from '../../dashboard/types/dashboard-screen-state';
import { UserCreateDrawer } from './user-create-drawer';
import { UsersList } from './users-list';

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
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [pendingResetUser, setPendingResetUser] = useState<UserOverview | null>(
    null,
  );
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    tone: 'success' | 'error';
  } | null>(null);

  // Espejo de `userNotice` en un toast flotante: evita empujar el layout y
  // auto-desaparece. Errores quedan visibles más tiempo para poder leerlos.
  useEffect(() => {
    if (!userNotice) return;
    const message = userNotice;
    const tone = userNoticeTone;
    setToast({ message, tone });
    const timeoutMs = tone === 'error' ? 8000 : 4000;
    const timer = window.setTimeout(() => {
      setToast((current) =>
        current && current.message === message ? null : current,
      );
    }, timeoutMs);
    return () => window.clearTimeout(timer);
  }, [userNotice, userNoticeTone]);

  async function handleResetConfirmed(userId: string): Promise<void> {
    const result = await onPasswordReset(userId);
    setPendingResetUser(null);
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

  const canInteract = screenState === 'ready';

  return (
    <WorkspaceShell
      residentCount={residentCount}
      session={session}
      onLogout={onLogout}
    >
      {toast && (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 sm:justify-end"
          data-testid="users-admin-toast"
        >
          <div
            role="status"
            aria-live="polite"
            className={`pointer-events-auto flex items-start gap-3 rounded-[20px] px-5 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.14)] max-w-[360px] ${
              toast.tone === 'error'
                ? 'border border-[rgba(168,43,17,0.2)] bg-[rgb(255,246,243)] text-[rgb(130,44,25)]'
                : 'border border-[rgba(0,102,132,0.18)] bg-[rgb(240,250,253)] text-brand-secondary'
            }`}
          >
            <span className="flex-1 leading-[1.5]">{toast.message}</span>
            <button
              type="button"
              className="shrink-0 text-sm underline underline-offset-2 opacity-70 hover:opacity-100"
              onClick={() => setToast(null)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <section
        className={`${surfaceCardClassName} grid gap-4`}
        data-testid="users-admin-header"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-1.5">
            <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
              Personal
            </span>
            <h1 className="text-[1.45rem] font-bold tracking-[-0.04em] text-brand-text">
              Equipo de la organización
            </h1>
            <p className="max-w-[620px] text-brand-text-secondary">
              Administrá al personal de la organización, su tipo de
              contratación y su acceso al sistema. Desde acá podés cargar las
              horas trabajadas de los externos.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              data-testid="users-admin-add-button"
              className={primaryButtonClassName}
              disabled={!canInteract}
              onClick={() => setIsCreateDrawerOpen(true)}
            >
              + Agregar personal
            </button>
            <Link
              to="/personal/horas"
              data-testid="users-admin-shortcut-horas"
              className={secondaryButtonClassName}
            >
              Ir a carga de horas
            </Link>
          </div>
        </div>
      </section>

      {screenState === 'loading' && (
        <StatusNotice message="Cargando personal de la organización activa." />
      )}

      {screenState === 'error' && (
        <StatusNotice
          title="No se pudo cargar el personal."
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
          className={surfaceCardClassName}
          data-testid="users-admin-workspace"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                Personal de la organización
              </span>
              <h2 className="mt-1 text-[1.15rem] font-bold tracking-[-0.04em] text-brand-text">
                {visibleUsers.length === 1
                  ? '1 persona'
                  : `${visibleUsers.length} personas`}
              </h2>
            </div>
          </div>

          <UsersList
            users={visibleUsers}
            resettingUserId={resettingUserId}
            onResetClick={(user) => {
              setPendingResetUser(user);
              setCopyFeedback(null);
              onClearResetResult();
            }}
            onAddClick={() => setIsCreateDrawerOpen(true)}
          />
        </section>
      )}

      <UserCreateDrawer
        isOpen={isCreateDrawerOpen}
        isSavingUser={isSavingUser}
        onClose={() => setIsCreateDrawerOpen(false)}
        onCreate={onUserCreate}
      />

      {pendingResetUser && (
        <div
          role="dialog"
          aria-modal="true"
          data-testid="users-reset-confirm-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(9,16,28,0.55)] px-4"
        >
          <div className="grid w-full max-w-[440px] gap-4 rounded-[28px] bg-white px-6 py-6 shadow-panel">
            <h3 className="text-[1.2rem] font-bold tracking-[-0.03em] text-brand-text">
              ¿Restablecer el acceso de {pendingResetUser.fullName}?
            </h3>
            <p className="text-brand-text-secondary">
              Se generará una contraseña temporal. La persona deberá
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
                  ? 'Restableciendo…'
                  : 'Confirmar'}
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
              Compártala con la persona por un canal seguro. Sólo podrá verla
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
