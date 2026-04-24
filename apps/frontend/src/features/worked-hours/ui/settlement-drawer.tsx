import { useEffect, useMemo, useState } from 'react';

import type {
  MembershipHourlyRate,
  TeamMemberOverview,
  WorkedHourEntry,
  WorkedHourEntryCreateInput,
  WorkedHourEntryUpdateInput,
} from '@gentrix/shared-types';

import {
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from '../../../shared/ui/class-names';
import { arToIso, isoToAr, todayAr } from '../lib/date-format';
import {
  computePeriod,
  type PeriodPreset,
  type PeriodSelection,
} from '../hooks/use-worked-hours-route';

interface SettlementDrawerProps {
  isOpen: boolean;
  member: TeamMemberOverview;
  currentRate: MembershipHourlyRate | null;
  period: PeriodSelection;
  entries: WorkedHourEntry[];
  isSaving: boolean;
  onClose: () => void;
  onPeriodChange: (next: PeriodSelection) => void | Promise<void>;
  onCreateEntry: (input: WorkedHourEntryCreateInput) => Promise<boolean>;
  onUpdateEntry: (
    entryId: string,
    input: WorkedHourEntryUpdateInput,
  ) => Promise<boolean>;
  onDeleteEntry: (entryId: string) => Promise<boolean>;
  onIssue: (notes: string | undefined) => Promise<boolean>;
}

function smallButtonClassName(): string {
  return 'inline-flex min-h-9 items-center justify-center rounded-xl border border-[rgba(47,79,79,0.16)] bg-white px-3 text-[0.85rem] font-semibold text-brand-secondary transition hover:-translate-y-px disabled:opacity-60';
}

export function SettlementDrawer({
  isOpen,
  member,
  currentRate,
  period,
  entries,
  isSaving,
  onClose,
  onPeriodChange,
  onCreateEntry,
  onUpdateEntry,
  onDeleteEntry,
  onIssue,
}: SettlementDrawerProps) {
  const [workDateAr, setWorkDateAr] = useState(todayAr());
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');
  const [entryError, setEntryError] = useState<string | null>(null);
  const [settlementNotes, setSettlementNotes] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setWorkDateAr(todayAr());
    setHours('');
    setNotes('');
    setEntryError(null);
    setSettlementNotes('');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(event: KeyboardEvent): void {
      if (event.key === 'Escape' && !isSaving) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, isSaving, onClose]);

  const draftEntries = useMemo(
    () => entries.filter((entry) => entry.settlementId === null),
    [entries],
  );

  const totalDraftHours = useMemo(
    () =>
      draftEntries
        .reduce((acc, entry) => acc + Number.parseFloat(entry.hours), 0)
        .toFixed(2),
    [draftEntries],
  );

  const estimatedTotal = useMemo(() => {
    if (!currentRate) return null;
    const rate = Number.parseFloat(currentRate.rate);
    if (!Number.isFinite(rate)) return null;
    const total = Number.parseFloat(totalDraftHours) * rate;
    return total.toFixed(2);
  }, [currentRate, totalDraftHours]);

  async function applyPreset(preset: PeriodPreset): Promise<void> {
    const computed = computePeriod(preset);
    await onPeriodChange({ preset, ...computed });
  }

  async function submitEntry(): Promise<void> {
    if (!currentRate) return;
    const trimmed = hours.trim();
    if (!trimmed || Number.parseFloat(trimmed) <= 0) {
      setEntryError('Las horas deben ser mayores a 0.');
      return;
    }
    const iso = arToIso(workDateAr);
    if (!iso) {
      setEntryError('Usá el formato DD/MM/AAAA en la fecha.');
      return;
    }
    setEntryError(null);
    const ok = await onCreateEntry({
      workDate: iso,
      hours: trimmed,
      notes: notes.trim() || undefined,
    });
    if (ok) {
      setHours('');
      setNotes('');
    }
  }

  async function submitIssue(): Promise<void> {
    if (draftEntries.length === 0 || !currentRate) return;
    const ok = await onIssue(settlementNotes.trim() || undefined);
    if (ok) onClose();
  }

  if (!isOpen) return null;

  const canAddEntries = !!currentRate;
  const canIssue = canAddEntries && draftEntries.length > 0 && !isSaving;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Nueva liquidación"
      data-testid="worked-hours-settlement-drawer"
      className="fixed inset-0 z-50 flex justify-end bg-[rgba(9,16,28,0.45)]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) onClose();
      }}
    >
      <div className="flex h-full w-full max-w-[640px] flex-col overflow-y-auto bg-white shadow-[-24px_0_48px_rgba(15,23,42,0.18)]">
        <header className="flex items-start justify-between gap-3 border-b border-[rgba(0,102,132,0.08)] px-6 py-5">
          <div className="grid gap-1">
            <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
              Nueva liquidación
            </span>
            <h2 className="text-[1.2rem] font-bold tracking-[-0.04em] text-brand-text">
              {member.fullName}
            </h2>
            <span className="text-sm text-brand-text-secondary">
              Tarifa vigente{' '}
              {currentRate
                ? `${currentRate.currency} ${currentRate.rate} / hora`
                : '—'}
            </span>
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

        <div className="flex flex-1 flex-col gap-5 px-6 py-5">
          <section className="grid gap-3">
            <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
              Período
            </span>
            <div className="flex flex-wrap gap-2">
              <PresetChip
                active={period.preset === 'month'}
                label="Mes"
                onClick={() => {
                  void applyPreset('month');
                }}
              />
              <PresetChip
                active={period.preset === 'fortnight'}
                label="Quincena"
                onClick={() => {
                  void applyPreset('fortnight');
                }}
              />
              <PresetChip
                active={period.preset === 'custom'}
                label="Día"
                onClick={() => {
                  void applyPreset('custom');
                }}
              />
            </div>
            {period.preset === 'custom' ? (
              <div className="grid gap-3 min-[520px]:grid-cols-[220px]">
                <PeriodBoundaryInput
                  label="Fecha"
                  value={period.periodStart}
                  onCommit={(iso) => {
                    void onPeriodChange({
                      preset: 'custom',
                      periodStart: iso,
                      periodEnd: iso,
                    });
                  }}
                />
              </div>
            ) : (
              <div className="grid gap-3 min-[520px]:grid-cols-2">
                <PeriodBoundaryInput
                  label="Desde"
                  value={period.periodStart}
                  onCommit={(iso) => {
                    void onPeriodChange({
                      preset: 'custom',
                      periodStart: iso,
                      periodEnd: period.periodEnd,
                    });
                  }}
                />
                <PeriodBoundaryInput
                  label="Hasta"
                  value={period.periodEnd}
                  onCommit={(iso) => {
                    void onPeriodChange({
                      preset: 'custom',
                      periodStart: period.periodStart,
                      periodEnd: iso,
                    });
                  }}
                />
              </div>
            )}
          </section>

          <section className="grid gap-3 rounded-[18px] border border-[rgba(0,102,132,0.08)] bg-brand-neutral/60 p-4">
            <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
              Cargar horas
            </span>
            {!canAddEntries && (
              <p className="text-sm text-[rgb(130,77,25)]">
                Sin tarifa vigente no se pueden cargar horas.
              </p>
            )}
            {entryError && (
              <p className="text-sm text-[rgb(130,44,25)]">{entryError}</p>
            )}
            <div className="grid gap-3 min-[520px]:grid-cols-[150px_110px_minmax(0,1fr)_auto]">
              <label className="grid gap-1">
                <span className="text-[0.76rem] uppercase tracking-[0.12em] text-brand-text-muted">
                  Fecha
                </span>
                <input
                  className={inputClassName}
                  type="text"
                  inputMode="numeric"
                  placeholder="DD/MM/AAAA"
                  maxLength={10}
                  disabled={!canAddEntries}
                  value={workDateAr}
                  onChange={(event) => {
                    setWorkDateAr(event.target.value);
                    if (entryError) setEntryError(null);
                  }}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-[0.76rem] uppercase tracking-[0.12em] text-brand-text-muted">
                  Horas
                </span>
                <input
                  className={inputClassName}
                  type="number"
                  step="0.25"
                  min="0.25"
                  max="24"
                  disabled={!canAddEntries}
                  value={hours}
                  onChange={(event) => setHours(event.target.value)}
                  placeholder="4.00"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-[0.76rem] uppercase tracking-[0.12em] text-brand-text-muted">
                  Nota (opcional)
                </span>
                <input
                  className={inputClassName}
                  type="text"
                  disabled={!canAddEntries}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Detalle del servicio"
                />
              </label>
              <div className="self-end">
                <button
                  type="button"
                  data-testid="worked-hours-settlement-drawer-add-entry"
                  className={primaryButtonClassName}
                  disabled={!canAddEntries || !hours || isSaving}
                  onClick={() => {
                    void submitEntry();
                  }}
                >
                  Agregar
                </button>
              </div>
            </div>
          </section>

          <section className="grid gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                Horas del período
              </span>
              <span className="text-[0.85rem] text-brand-text-muted">
                {isoToAr(period.periodStart)} → {isoToAr(period.periodEnd)}
              </span>
            </div>
            {draftEntries.length === 0 ? (
              <div className="rounded-[16px] border border-dashed border-[rgba(0,102,132,0.18)] bg-brand-neutral px-4 py-5 text-center text-brand-text-secondary">
                Todavía no cargaste horas para este período.
              </div>
            ) : (
              <ul className="grid gap-2">
                {draftEntries.map((entry) => (
                  <DraftEntryRow
                    key={entry.id}
                    entry={entry}
                    isSaving={isSaving}
                    onUpdate={onUpdateEntry}
                    onDelete={onDeleteEntry}
                  />
                ))}
              </ul>
            )}
          </section>

          <section className="grid gap-2 rounded-[18px] border border-[rgba(0,102,132,0.12)] bg-brand-primary/5 p-4">
            <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-primary">
              Resumen
            </span>
            <div className="grid gap-1 text-brand-text">
              <SummaryRow
                label="Total de horas"
                value={`${totalDraftHours} h`}
              />
              <SummaryRow
                label="Tarifa aplicada"
                value={
                  currentRate
                    ? `${currentRate.currency} ${currentRate.rate} / hora`
                    : '—'
                }
              />
              <SummaryRow
                label="Total estimado"
                value={
                  estimatedTotal && currentRate
                    ? `${currentRate.currency} ${estimatedTotal}`
                    : '—'
                }
                emphasis
              />
            </div>
          </section>

          <section className="grid gap-2">
            <label className="grid gap-1.5">
              <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                Nota de la liquidación (opcional)
              </span>
              <input
                className={inputClassName}
                type="text"
                disabled={!canAddEntries}
                value={settlementNotes}
                onChange={(event) => setSettlementNotes(event.target.value)}
                placeholder="Aclaración que acompaña el resumen"
              />
            </label>
            <p className="text-[0.82rem] text-brand-text-muted">
              Al generar la liquidación, se congelarán las horas y la tarifa
              aplicada para este período.
            </p>
          </section>
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
            data-testid="worked-hours-settlement-drawer-submit"
            className={primaryButtonClassName}
            disabled={!canIssue}
            onClick={() => {
              void submitIssue();
            }}
          >
            {isSaving ? 'Generando…' : 'Generar liquidación'}
          </button>
        </footer>
      </div>
    </div>
  );
}

function PresetChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  const className = active
    ? 'inline-flex min-h-9 items-center justify-center rounded-full bg-brand-primary px-4 text-[0.85rem] font-semibold text-white shadow-brand'
    : 'inline-flex min-h-9 items-center justify-center rounded-full border border-[rgba(0,102,132,0.14)] bg-white px-4 text-[0.85rem] font-semibold text-brand-text-secondary hover:border-[rgba(0,102,132,0.32)] hover:text-brand-secondary';
  return (
    <button type="button" className={className} onClick={onClick}>
      {label}
    </button>
  );
}

function PeriodBoundaryInput({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: string;
  onCommit: (iso: string) => void;
}) {
  const propValueAr = isoToAr(value);
  const [text, setText] = useState(propValueAr);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(propValueAr);
    setError(null);
  }, [propValueAr]);

  function commit(): void {
    const iso = arToIso(text);
    if (!iso) {
      setError('Usá DD/MM/AAAA.');
      return;
    }
    setError(null);
    onCommit(iso);
  }

  return (
    <label className="grid gap-1">
      <span className="text-[0.76rem] uppercase tracking-[0.12em] text-brand-text-muted">
        {label}
      </span>
      <input
        className={inputClassName}
        type="text"
        inputMode="numeric"
        placeholder="DD/MM/AAAA"
        maxLength={10}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          if (error) setError(null);
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commit();
          }
        }}
      />
      {error && <span className="text-sm text-[rgb(130,44,25)]">{error}</span>}
    </label>
  );
}

function DraftEntryRow({
  entry,
  isSaving,
  onUpdate,
  onDelete,
}: {
  entry: WorkedHourEntry;
  isSaving: boolean;
  onUpdate: (
    entryId: string,
    input: WorkedHourEntryUpdateInput,
  ) => Promise<boolean>;
  onDelete: (entryId: string) => Promise<boolean>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [workDateAr, setWorkDateAr] = useState(isoToAr(entry.workDate));
  const [hours, setHours] = useState(entry.hours);
  const [notes, setNotes] = useState(entry.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  async function submit(): Promise<void> {
    const iso = arToIso(workDateAr);
    if (!iso) {
      setError('Usá DD/MM/AAAA.');
      return;
    }
    setError(null);
    const ok = await onUpdate(entry.id, {
      workDate: iso,
      hours,
      notes: notes.trim() || undefined,
    });
    if (ok) setIsEditing(false);
  }

  if (isEditing) {
    return (
      <li className="grid gap-2 rounded-[16px] border border-[rgba(0,102,132,0.2)] bg-white px-3 py-3 min-[520px]:grid-cols-[120px_90px_minmax(0,1fr)_auto]">
        <input
          className={inputClassName}
          type="text"
          inputMode="numeric"
          maxLength={10}
          value={workDateAr}
          onChange={(event) => {
            setWorkDateAr(event.target.value);
            if (error) setError(null);
          }}
        />
        <input
          className={inputClassName}
          type="number"
          step="0.25"
          value={hours}
          onChange={(event) => setHours(event.target.value)}
        />
        <input
          className={inputClassName}
          type="text"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
        <div className="flex gap-2">
          <button
            type="button"
            className={smallButtonClassName()}
            disabled={isSaving}
            onClick={() => {
              void submit();
            }}
          >
            Guardar
          </button>
          <button
            type="button"
            className={smallButtonClassName()}
            onClick={() => setIsEditing(false)}
          >
            Cancelar
          </button>
        </div>
        {error && (
          <span className="text-sm text-[rgb(130,44,25)] min-[520px]:col-span-4">
            {error}
          </span>
        )}
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-[rgba(0,102,132,0.08)] bg-white px-3 py-2">
      <div className="grid gap-0.5">
        <strong className="text-brand-text">
          {isoToAr(entry.workDate)} · {entry.hours} h
        </strong>
        {entry.notes && (
          <span className="text-[0.85rem] text-brand-text-secondary">
            {entry.notes}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className={smallButtonClassName()}
          onClick={() => setIsEditing(true)}
        >
          Editar
        </button>
        <button
          type="button"
          className={smallButtonClassName()}
          disabled={isSaving}
          onClick={() => {
            void onDelete(entry.id);
          }}
        >
          Eliminar
        </button>
      </div>
    </li>
  );
}

function SummaryRow({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-brand-text-secondary">{label}</span>
      <strong
        className={emphasis ? 'text-[1.1rem] text-brand-text' : 'text-brand-text'}
      >
        {value}
      </strong>
    </div>
  );
}
