import { useEffect, useRef, useState } from 'react';

import type {
  UserCreateInput,
  UserCreateRole,
  UserOverview,
} from '@gentrix/shared-types';

import {
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from '../../../shared/ui/class-names';
import { SelectField } from '../../../shared/ui/select-field';

interface UserCreateDrawerProps {
  isOpen: boolean;
  isSavingUser: boolean;
  onClose: () => void;
  onCreate: (input: UserCreateInput) => Promise<UserOverview | null>;
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

function createInitialFormState(): UserFormState {
  return {
    fullName: '',
    email: '',
    role: 'assistant',
    password: '',
  };
}

export function UserCreateDrawer({
  isOpen,
  isSavingUser,
  onClose,
  onCreate,
}: UserCreateDrawerProps) {
  const [formState, setFormState] = useState<UserFormState>(
    createInitialFormState,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormState(createInitialFormState());
      setFormError(null);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(event: KeyboardEvent): void {
      if (event.key === 'Escape' && !isSavingUser) {
        onClose();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, isSavingUser, onClose]);

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
    const created = await onCreate({
      fullName,
      email,
      role: formState.role,
      password,
    });

    if (created) {
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Agregar personal"
      data-testid="users-create-drawer"
      className="fixed inset-0 z-50 flex justify-end bg-[rgba(9,16,28,0.45)]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSavingUser) {
          onClose();
        }
      }}
    >
      <div
        ref={panelRef}
        className="flex h-full w-full max-w-[460px] flex-col overflow-y-auto bg-white shadow-[-24px_0_48px_rgba(15,23,42,0.18)]"
      >
        <header className="flex items-start justify-between gap-3 border-b border-[rgba(0,102,132,0.08)] px-6 py-5">
          <div className="grid gap-1">
            <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
              Alta rápida
            </span>
            <h2 className="text-[1.2rem] font-bold tracking-[-0.04em] text-brand-text">
              Nuevo personal
            </h2>
            <span className="text-sm text-brand-text-secondary">
              Creá la persona y su acceso al sistema en un solo paso.
            </span>
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            data-testid="users-create-drawer-close"
            className="-mr-2 rounded-full p-2 text-brand-text-muted transition hover:bg-brand-neutral hover:text-brand-text"
            disabled={isSavingUser}
            onClick={onClose}
          >
            <span aria-hidden="true" className="text-xl leading-none">
              ×
            </span>
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-[14px] px-6 py-5">
          {formError && (
            <div
              data-testid="users-create-drawer-error"
              className="rounded-[18px] border border-[rgba(168,43,17,0.16)] bg-[rgba(168,43,17,0.08)] px-4 py-3 text-[rgb(130,44,25)]"
            >
              {formError}
            </div>
          )}

          <label className="grid gap-2.5">
            <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
              Nombre completo
            </span>
            <input
              data-testid="users-form-full-name-input"
              className={inputClassName}
              type="text"
              autoFocus
              value={formState.fullName}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  fullName: event.target.value,
                }))
              }
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
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
            />
          </label>

          <label className="grid gap-2.5">
            <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
              Puesto / Rol
            </span>
            <SelectField
              name="users.role"
              testId="users-form-role-select"
              value={formState.role}
              options={roleOptions}
              onChange={(nextValue) =>
                setFormState((current) => ({
                  ...current,
                  role: nextValue as UserCreateRole,
                }))
              }
            />
          </label>

          <label className="grid gap-2.5">
            <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
              Contraseña inicial
            </span>
            <input
              data-testid="users-form-password-input"
              className={inputClassName}
              type="text"
              value={formState.password}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
            />
            <span className="text-[0.82rem] text-brand-text-muted">
              La persona podrá cambiarla al ingresar por primera vez.
            </span>
          </label>
        </div>

        <footer className="flex flex-wrap justify-end gap-3 border-t border-[rgba(0,102,132,0.08)] px-6 py-4">
          <button
            type="button"
            className={secondaryButtonClassName}
            disabled={isSavingUser}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            data-testid="users-form-submit-button"
            className={primaryButtonClassName}
            disabled={isSavingUser}
            onClick={() => {
              void handleSubmit();
            }}
          >
            {isSavingUser ? 'Guardando…' : 'Crear personal'}
          </button>
        </footer>
      </div>
    </div>
  );
}
