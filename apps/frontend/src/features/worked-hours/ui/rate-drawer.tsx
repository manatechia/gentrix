import { useEffect, useState } from 'react';

import type {
  MembershipHourlyRate,
  MembershipHourlyRateCreateInput,
} from '@gentrix/shared-types';

import {
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from '../../../shared/ui/class-names';
import { arToIso, isoToAr, todayAr } from '../lib/date-format';

interface RateDrawerProps {
  isOpen: boolean;
  memberName: string;
  currentRate: MembershipHourlyRate | null;
  isSaving: boolean;
  onClose: () => void;
  onCreate: (input: MembershipHourlyRateCreateInput) => Promise<boolean>;
}

export function RateDrawer({
  isOpen,
  memberName,
  currentRate,
  isSaving,
  onClose,
  onCreate,
}: RateDrawerProps) {
  const [rate, setRate] = useState('');
  const [effectiveFromAr, setEffectiveFromAr] = useState(todayAr());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setRate('');
    setEffectiveFromAr(todayAr());
    setError(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(event: KeyboardEvent): void {
      if (event.key === 'Escape' && !isSaving) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, isSaving, onClose]);

  async function submit(): Promise<void> {
    const trimmed = rate.trim();
    if (!trimmed || Number.parseFloat(trimmed) <= 0) {
      setError('Ingresá un monto mayor a 0.');
      return;
    }
    const iso = arToIso(effectiveFromAr);
    if (!iso) {
      setError('Usá el formato DD/MM/AAAA en la fecha.');
      return;
    }
    setError(null);
    const ok = await onCreate({
      rate: trimmed,
      currency: 'ARS',
      effectiveFrom: iso,
    });
    if (ok) onClose();
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tarifa por hora"
      data-testid="worked-hours-rate-drawer"
      className="fixed inset-0 z-50 flex justify-end bg-[rgba(9,16,28,0.45)]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) onClose();
      }}
    >
      <div className="flex h-full w-full max-w-[440px] flex-col overflow-y-auto bg-white shadow-[-24px_0_48px_rgba(15,23,42,0.18)]">
        <header className="flex items-start justify-between gap-3 border-b border-[rgba(0,102,132,0.08)] px-6 py-5">
          <div className="grid gap-1">
            <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
              {currentRate ? 'Nueva tarifa' : 'Crear tarifa'}
            </span>
            <h2 className="text-[1.2rem] font-bold tracking-[-0.04em] text-brand-text">
              {memberName}
            </h2>
            {currentRate && (
              <span className="text-sm text-brand-text-secondary">
                Tarifa vigente: {currentRate.currency} {currentRate.rate} /
                hora desde {isoToAr(currentRate.effectiveFrom)}. Al guardar una
                nueva, se cerrará la anterior en la fecha indicada.
              </span>
            )}
            {!currentRate && (
              <span className="text-sm text-brand-text-secondary">
                Definí el valor por hora para poder cargar horas y generar
                liquidaciones.
              </span>
            )}
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            className="-mr-2 rounded-full p-2 text-brand-text-muted transition hover:bg-brand-neutral hover:text-brand-text"
            disabled={isSaving}
            onClick={onClose}
          >
            <span aria-hidden="true" className="text-xl leading-none">
              ×
            </span>
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-4 px-6 py-5">
          {error && (
            <div className="rounded-[18px] border border-[rgba(168,43,17,0.16)] bg-[rgba(168,43,17,0.08)] px-4 py-3 text-[rgb(130,44,25)]">
              {error}
            </div>
          )}

          <label className="grid gap-2">
            <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
              Tarifa por hora (ARS)
            </span>
            <input
              data-testid="worked-hours-rate-drawer-amount"
              className={inputClassName}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              autoFocus
              value={rate}
              onChange={(event) => setRate(event.target.value)}
              placeholder="15000.00"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
              Vigente desde
            </span>
            <input
              data-testid="worked-hours-rate-drawer-from"
              className={inputClassName}
              type="text"
              inputMode="numeric"
              placeholder="DD/MM/AAAA"
              maxLength={10}
              value={effectiveFromAr}
              onChange={(event) => {
                setEffectiveFromAr(event.target.value);
                if (error) setError(null);
              }}
            />
          </label>
        </div>

        <footer className="flex flex-wrap justify-end gap-3 border-t border-[rgba(0,102,132,0.08)] px-6 py-4">
          <button
            type="button"
            className={secondaryButtonClassName}
            disabled={isSaving}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            data-testid="worked-hours-rate-drawer-submit"
            className={primaryButtonClassName}
            disabled={isSaving || !rate}
            onClick={() => {
              void submit();
            }}
          >
            {isSaving ? 'Guardando…' : 'Guardar tarifa'}
          </button>
        </footer>
      </div>
    </div>
  );
}
