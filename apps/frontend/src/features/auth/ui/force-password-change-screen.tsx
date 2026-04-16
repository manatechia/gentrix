import { useState, type FormEvent } from 'react';

import {
  primaryButtonClassName,
  secondaryButtonClassName,
  surfaceCardClassName,
} from '../../../shared/ui/class-names';
import { PasswordInput } from '../../../shared/ui/password-input';
import { getApiErrorMessage } from '../../../shared/lib/api-envelope';
import { changeOwnPassword } from '../../users/services/users-service';
import { validatePasswordPolicy } from '../lib/password-policy';

interface ForcePasswordChangeScreenProps {
  onCompleted: () => Promise<void> | void;
  onLogout: () => Promise<void> | void;
}

export function ForcePasswordChangeScreen({
  onCompleted,
  onLogout,
}: ForcePasswordChangeScreenProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const violations = validatePasswordPolicy(newPassword);
  const canSubmit =
    !isSubmitting &&
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    violations.length === 0 &&
    newPassword === confirmPassword;

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFormError(null);
    setSuccessNotice(null);

    if (newPassword !== confirmPassword) {
      setFormError('La nueva contraseña y la confirmación no coinciden.');
      return;
    }

    if (violations.length > 0) {
      setFormError(
        'La nueva contraseña no cumple la política mínima de seguridad.',
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await changeOwnPassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setSuccessNotice('Contraseña actualizada correctamente.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await onCompleted();
    } catch (error) {
      setFormError(
        getApiErrorMessage(error, 'No pude actualizar la contraseña.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      data-testid="force-password-change-screen"
      className="min-h-screen bg-brand-neutral px-4 py-10"
    >
      <form
        onSubmit={handleSubmit}
        className={`mx-auto grid max-w-[480px] gap-5 ${surfaceCardClassName}`}
      >
        <header className="grid gap-2">
          <span className="text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-brand-primary">
            Seguridad
          </span>
          <h1 className="text-[1.4rem] font-bold tracking-[-0.03em] text-brand-text">
            Tenés que cambiar tu contraseña
          </h1>
          <p className="text-brand-text-secondary">
            Por seguridad, no podés navegar el sistema hasta establecer una
            contraseña nueva.
          </p>
        </header>

        {formError && (
          <div
            role="alert"
            data-testid="force-password-change-error"
            className="rounded-[22px] border border-[rgba(168,43,17,0.16)] bg-[rgba(168,43,17,0.08)] px-4 py-3 text-[rgb(130,44,25)]"
          >
            {formError}
          </div>
        )}
        {successNotice && (
          <div
            role="status"
            data-testid="force-password-change-success"
            className="rounded-[22px] border border-[rgba(0,102,132,0.14)] bg-[rgba(0,102,132,0.08)] px-4 py-3 text-brand-secondary"
          >
            {successNotice}
          </div>
        )}

        <label className="grid gap-2">
          <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
            Contraseña actual
          </span>
          <PasswordInput
            data-testid="force-password-change-current-input"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
            Nueva contraseña
          </span>
          <PasswordInput
            data-testid="force-password-change-new-input"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
            Confirmar nueva contraseña
          </span>
          <PasswordInput
            data-testid="force-password-change-confirm-input"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </label>

        <section
          aria-label="Política de contraseña"
          className="rounded-[22px] border border-[rgba(0,102,132,0.08)] bg-brand-neutral px-4 py-3"
        >
          <strong className="text-brand-text">La contraseña debe:</strong>
          <ul className="mt-2 grid gap-1 text-[0.9rem] text-brand-text-secondary">
            <PolicyItem
              label="Tener al menos 8 caracteres"
              satisfied={!violations.some((v) => v.code === 'min-length')}
            />
            <PolicyItem
              label="Incluir una mayúscula"
              satisfied={!violations.some((v) => v.code === 'needs-uppercase')}
            />
            <PolicyItem
              label="Incluir una minúscula"
              satisfied={!violations.some((v) => v.code === 'needs-lowercase')}
            />
            <PolicyItem
              label="Incluir un número"
              satisfied={!violations.some((v) => v.code === 'needs-digit')}
            />
            <PolicyItem
              label="Incluir un carácter especial"
              satisfied={!violations.some((v) => v.code === 'needs-special')}
            />
          </ul>
        </section>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={() => {
              void onLogout();
            }}
          >
            Cerrar sesión
          </button>
          <button
            type="submit"
            data-testid="force-password-change-submit"
            className={primaryButtonClassName}
            disabled={!canSubmit}
          >
            {isSubmitting ? 'Guardando…' : 'Actualizar contraseña'}
          </button>
        </div>
      </form>
    </main>
  );
}

function PolicyItem({
  label,
  satisfied,
}: {
  label: string;
  satisfied: boolean;
}) {
  return (
    <li
      className={`flex items-center gap-2 ${
        satisfied ? 'text-brand-secondary' : 'text-brand-text-muted'
      }`}
    >
      <span aria-hidden>{satisfied ? '✓' : '•'}</span>
      <span>{label}</span>
    </li>
  );
}
