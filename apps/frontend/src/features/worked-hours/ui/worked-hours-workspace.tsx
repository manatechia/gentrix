import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import type { AuthSession } from '@gentrix/shared-types';

import {
  badgeBaseClassName,
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  shellCardClassName,
  surfaceCardClassName,
} from '../../../shared/ui/class-names';
import { WorkspaceShell } from '../../dashboard/ui/workspace-shell';
import { StatusNotice } from '../../dashboard/ui/status-notice';
import {
  computePeriod,
  type PeriodPreset,
  type useWorkedHoursRoute,
} from '../hooks/use-worked-hours-route';

// El `<input type="date">` nativo se muestra según el locale del sistema
// operativo (no del `<html lang>`), así que en máquinas con locale `en-US`
// aparece como MM/DD/AAAA. Forzamos DD/MM/AAAA manejando la edición como
// texto y convirtiendo a ISO sólo cuando se persiste.
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const arDatePattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;

function isoToAr(iso: string): string {
  if (!iso || !isoDatePattern.test(iso.slice(0, 10))) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

function arToIso(ar: string): string | null {
  const match = arDatePattern.exec(ar.trim());
  if (!match) return null;
  const [, d, m, y] = match;
  const day = Number.parseInt(d, 10);
  const month = Number.parseInt(m, 10);
  const year = Number.parseInt(y, 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return `${y}-${m}-${d}`;
}

function todayAr(): string {
  return isoToAr(new Date().toISOString().slice(0, 10));
}

interface WorkedHoursWorkspaceProps {
  session: AuthSession;
  residentCount: number;
  route: ReturnType<typeof useWorkedHoursRoute>;
  onLogout: () => void | Promise<void>;
}

export function WorkedHoursWorkspace({
  session,
  residentCount,
  route,
  onLogout,
}: WorkedHoursWorkspaceProps) {
  const {
    screenState,
    loadError,
    externals,
    selectedMember,
    selectedUserId,
    currentRate,
    rates,
    entries,
    settlements,
    period,
    notice,
    isSaving,
    preview,
    activeSettlement,
    handleSelectExternal,
    handlePeriodChange,
    handleCreateRate,
    handleCreateEntry,
    handleUpdateEntry,
    handleDeleteEntry,
    handlePreview,
    handleIssue,
    handleOpenSettlement,
    handleMarkPaid,
    handleCancelSettlement,
    handleCloseSettlement,
    handleClosePreview,
    handleDismissNotice,
    handleRetry,
  } = route;

  return (
    <WorkspaceShell
      residentCount={residentCount}
      session={session}
      onLogout={onLogout}
    >
      <section
        className={`${shellCardClassName} grid gap-4 px-7 py-6`}
        data-testid="worked-hours-workspace"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-2">
            <span className="inline-flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-primary">
              Personal · Externos
            </span>
            <h1 className="text-[clamp(2rem,3.2vw,2.6rem)] font-bold tracking-[-0.04em] text-brand-text">
              Carga de horas y liquidaciones
            </h1>
            <p className="max-w-[64ch] leading-[1.6] text-brand-text-secondary">
              Cargá las horas trabajadas por cada profesional externo y liquidá
              el período para entregarle el resumen. La tarifa aplicada se
              congela al emitir la liquidación.
            </p>
          </div>
          <Link
            to="/personal"
            data-testid="worked-hours-back-to-personal"
            className={secondaryButtonClassName}
          >
            ← Volver a Personal
          </Link>
        </div>
      </section>

      {notice && (
        <section
          className={`${shellCardClassName} flex items-start justify-between gap-3 px-6 py-[18px] ${
            notice.tone === 'error'
              ? 'border border-[rgba(168,43,17,0.16)] bg-[rgba(168,43,17,0.08)] text-[rgb(130,44,25)]'
              : 'border border-[rgba(0,102,132,0.14)] bg-[rgba(0,102,132,0.08)] text-brand-secondary'
          }`}
        >
          <span className="leading-[1.55]">{notice.message}</span>
          <button
            type="button"
            className="text-sm underline"
            onClick={handleDismissNotice}
          >
            Cerrar
          </button>
        </section>
      )}

      {screenState === 'loading' && (
        <StatusNotice message="Cargando externos y sus horas..." />
      )}

      {screenState === 'error' && (
        <StatusNotice
          title="No pude cargar la pantalla."
          message={loadError ?? 'Ocurrió un error inesperado.'}
          actions={[
            { label: 'Reintentar', onClick: handleRetry },
            { label: 'Cerrar sesión', onClick: onLogout, variant: 'secondary' },
          ]}
        />
      )}

      {screenState === 'ready' && externals.length === 0 && (
        <section className={`${shellCardClassName} px-6 py-6`}>
          <p className="leading-[1.6] text-brand-text-secondary">
            No hay usuarios con rol externo en esta organización. Creá uno
            desde el panel de administración para empezar a cargar horas.
          </p>
        </section>
      )}

      {screenState === 'ready' && externals.length > 0 && (
        <section className="grid gap-[18px] min-[1181px]:grid-cols-[minmax(280px,0.7fr)_minmax(0,1.3fr)]">
          <article className={surfaceCardClassName}>
            <div className="mb-[14px] flex items-center justify-between gap-3">
              <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                Externos activos
              </span>
              <span
                className={`${badgeBaseClassName} bg-brand-primary/12 text-brand-primary`}
              >
                {externals.length}
              </span>
            </div>
            <div className="grid gap-2">
              {externals.map((member) => {
                const isSelected = member.id === selectedUserId;
                return (
                  <button
                    key={member.id}
                    type="button"
                    data-testid={`worked-hours-external-${member.id}`}
                    className={`grid gap-1 rounded-[20px] border px-4 py-3 text-left transition ${
                      isSelected
                        ? 'border-[rgba(0,102,132,0.26)] bg-brand-primary/8'
                        : 'border-[rgba(0,102,132,0.08)] bg-brand-neutral hover:border-[rgba(0,102,132,0.16)] hover:bg-white'
                    }`}
                    onClick={() => {
                      void handleSelectExternal(member.id);
                    }}
                  >
                    <strong className="text-brand-text">
                      {member.fullName}
                    </strong>
                    <span className="text-sm text-brand-text-secondary">
                      {member.email}
                    </span>
                    <span className="text-[0.85rem] text-brand-text-muted">
                      {member.jobTitleLabel ?? 'Sin puesto'}
                    </span>
                  </button>
                );
              })}
            </div>
          </article>

          {selectedMember && (
            <div className="grid gap-[18px]">
              <RateCard
                fullName={selectedMember.fullName}
                currentRate={currentRate}
                rateHistory={rates}
                isSaving={isSaving}
                onCreate={handleCreateRate}
              />

              <PeriodAndEntriesCard
                period={period}
                entries={entries}
                isSaving={isSaving}
                onPeriodChange={handlePeriodChange}
                onCreateEntry={handleCreateEntry}
                onUpdateEntry={handleUpdateEntry}
                onDeleteEntry={handleDeleteEntry}
                onPreviewSettlement={handlePreview}
              />

              <SettlementsListCard
                settlements={settlements}
                onOpen={handleOpenSettlement}
              />
            </div>
          )}
        </section>
      )}

      {preview && (
        <PreviewPanel
          preview={preview}
          isSaving={isSaving}
          onConfirm={handleIssue}
          onCancel={handleClosePreview}
        />
      )}

      {activeSettlement && (
        <SettlementDetailPanel
          detail={activeSettlement}
          memberName={selectedMember?.fullName ?? ''}
          isSaving={isSaving}
          onClose={handleCloseSettlement}
          onMarkPaid={handleMarkPaid}
          onCancel={handleCancelSettlement}
        />
      )}
    </WorkspaceShell>
  );
}

// ------------------------------------------------------------------------

function RateCard(props: {
  fullName: string;
  currentRate: ReturnType<typeof useWorkedHoursRoute>['currentRate'];
  rateHistory: ReturnType<typeof useWorkedHoursRoute>['rates'];
  isSaving: boolean;
  onCreate: ReturnType<typeof useWorkedHoursRoute>['handleCreateRate'];
}) {
  const { fullName, currentRate, rateHistory, isSaving, onCreate } = props;
  const [isCreating, setIsCreating] = useState(false);
  const [rate, setRate] = useState('');
  const [currency] = useState('ARS');
  const [effectiveFromAr, setEffectiveFromAr] = useState(todayAr());
  const [dateError, setDateError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  async function submit(): Promise<void> {
    const iso = arToIso(effectiveFromAr);
    if (!iso) {
      setDateError('Usá el formato DD/MM/AAAA.');
      return;
    }
    setDateError(null);
    const ok = await onCreate({ rate, currency, effectiveFrom: iso });
    if (ok) {
      setIsCreating(false);
      setRate('');
    }
  }

  return (
    <article className={surfaceCardClassName}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
            Tarifa de {fullName}
          </span>
          <h2 className="mt-1 text-[1.2rem] font-bold tracking-[-0.04em] text-brand-text">
            {currentRate
              ? `${currentRate.currency} ${currentRate.rate} / hora`
              : 'Sin tarifa cargada'}
          </h2>
          {currentRate && (
            <p className="mt-1 text-sm text-brand-text-muted">
              Vigente desde {isoToAr(currentRate.effectiveFrom)}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={() => setShowHistory((prev) => !prev)}
          >
            {showHistory ? 'Ocultar historial' : 'Historial'}
          </button>
          <button
            type="button"
            className={primaryButtonClassName}
            onClick={() => setIsCreating((prev) => !prev)}
          >
            {isCreating ? 'Cancelar' : 'Nueva tarifa'}
          </button>
        </div>
      </div>

      {isCreating && (
        <div className="mt-4 grid gap-3 min-[680px]:grid-cols-[180px_140px_auto]">
          <label className="grid gap-1.5">
            <span className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
              Tarifa por hora (ARS)
            </span>
            <input
              className={inputClassName}
              type="number"
              step="0.01"
              min="0.01"
              value={rate}
              onChange={(event) => setRate(event.target.value)}
              placeholder="15000.00"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
              Desde (DD/MM/AAAA)
            </span>
            <input
              className={inputClassName}
              type="text"
              inputMode="numeric"
              placeholder="DD/MM/AAAA"
              maxLength={10}
              value={effectiveFromAr}
              onChange={(event) => {
                setEffectiveFromAr(event.target.value);
                if (dateError) setDateError(null);
              }}
            />
          </label>
          <div className="self-end">
            <button
              type="button"
              className={primaryButtonClassName}
              disabled={!rate || isSaving}
              onClick={() => {
                void submit();
              }}
            >
              {isSaving ? 'Guardando...' : 'Guardar tarifa'}
            </button>
          </div>
          {dateError && (
            <p className="text-sm text-[rgb(130,44,25)] min-[680px]:col-span-3">
              {dateError}
            </p>
          )}
        </div>
      )}

      {showHistory && rateHistory.length > 0 && (
        <ul className="mt-4 grid gap-2">
          {rateHistory.map((r) => (
            <li
              key={r.id}
              className="rounded-[16px] border border-[rgba(0,102,132,0.08)] bg-brand-neutral px-3 py-2 text-sm text-brand-text-secondary"
            >
              <strong className="text-brand-text">
                {r.currency} {r.rate}
              </strong>
              {' — '}
              {isoToAr(r.effectiveFrom)} →{' '}
              {r.effectiveTo ? isoToAr(r.effectiveTo) : 'vigente'}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function PeriodAndEntriesCard(props: {
  period: ReturnType<typeof useWorkedHoursRoute>['period'];
  entries: ReturnType<typeof useWorkedHoursRoute>['entries'];
  isSaving: boolean;
  onPeriodChange: ReturnType<typeof useWorkedHoursRoute>['handlePeriodChange'];
  onCreateEntry: ReturnType<typeof useWorkedHoursRoute>['handleCreateEntry'];
  onUpdateEntry: ReturnType<typeof useWorkedHoursRoute>['handleUpdateEntry'];
  onDeleteEntry: ReturnType<typeof useWorkedHoursRoute>['handleDeleteEntry'];
  onPreviewSettlement: ReturnType<
    typeof useWorkedHoursRoute
  >['handlePreview'];
}) {
  const {
    period,
    entries,
    isSaving,
    onPeriodChange,
    onCreateEntry,
    onUpdateEntry,
    onDeleteEntry,
    onPreviewSettlement,
  } = props;

  const [workDateAr, setWorkDateAr] = useState(todayAr());
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');
  const [entryDateError, setEntryDateError] = useState<string | null>(null);

  const draftEntries = useMemo(
    () => entries.filter((entry) => entry.settlementId === null),
    [entries],
  );
  const settledEntries = useMemo(
    () => entries.filter((entry) => entry.settlementId !== null),
    [entries],
  );

  async function applyPreset(preset: PeriodPreset): Promise<void> {
    const computed = computePeriod(preset);
    await onPeriodChange({ preset, ...computed });
  }

  async function submitEntry(): Promise<void> {
    const iso = arToIso(workDateAr);
    if (!iso) {
      setEntryDateError('Usá el formato DD/MM/AAAA.');
      return;
    }
    setEntryDateError(null);
    const ok = await onCreateEntry({
      workDate: iso,
      hours,
      notes: notes || undefined,
    });
    if (ok) {
      setHours('');
      setNotes('');
    }
  }

  const totalDraftHours = draftEntries
    .reduce((acc, entry) => acc + Number.parseFloat(entry.hours), 0)
    .toFixed(2);

  return (
    <article className={surfaceCardClassName}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
            Horas del período
          </span>
          <h2 className="mt-1 text-[1.2rem] font-bold tracking-[-0.04em] text-brand-text">
            {isoToAr(period.periodStart)} → {isoToAr(period.periodEnd)}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <PeriodPresetButton
            active={period.preset === 'fortnight'}
            onClick={() => {
              void applyPreset('fortnight');
            }}
            label="Quincena"
          />
          <PeriodPresetButton
            active={period.preset === 'month'}
            onClick={() => {
              void applyPreset('month');
            }}
            label="Mes"
          />
          <PeriodPresetButton
            active={period.preset === 'custom'}
            onClick={() => {
              void applyPreset('custom');
            }}
            label="Custom"
          />
        </div>
      </div>

      {period.preset === 'custom' && (
        <div className="mt-4 grid gap-3 min-[680px]:grid-cols-[180px_180px]">
          <PeriodBoundaryInput
            label="Desde (DD/MM/AAAA)"
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
            label="Hasta (DD/MM/AAAA)"
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

      <div className="mt-4 grid gap-3 min-[780px]:grid-cols-[150px_110px_minmax(0,1fr)_auto]">
        <label className="grid gap-1.5">
          <span className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
            Fecha (DD/MM/AAAA)
          </span>
          <input
            className={inputClassName}
            type="text"
            inputMode="numeric"
            placeholder="DD/MM/AAAA"
            maxLength={10}
            value={workDateAr}
            onChange={(event) => {
              setWorkDateAr(event.target.value);
              if (entryDateError) setEntryDateError(null);
            }}
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
            Horas
          </span>
          <input
            className={inputClassName}
            type="number"
            step="0.25"
            min="0.25"
            max="24"
            value={hours}
            onChange={(event) => setHours(event.target.value)}
            placeholder="4.00"
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
            Nota (opcional)
          </span>
          <input
            className={inputClassName}
            type="text"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Detalle del servicio"
          />
        </label>
        <div className="self-end">
          <button
            type="button"
            className={primaryButtonClassName}
            disabled={!hours || isSaving}
            onClick={() => {
              void submitEntry();
            }}
          >
            {isSaving ? 'Guardando...' : 'Agregar horas'}
          </button>
        </div>
        {entryDateError && (
          <p className="text-sm text-[rgb(130,44,25)] min-[780px]:col-span-4">
            {entryDateError}
          </p>
        )}
      </div>

      <div className="mt-5 grid gap-2">
        {draftEntries.length === 0 && settledEntries.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-[rgba(0,102,132,0.22)] bg-brand-neutral px-4 py-4 text-brand-text-secondary">
            No hay horas cargadas para el período.
          </div>
        ) : (
          <>
            {draftEntries.map((entry) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                isSaving={isSaving}
                onUpdate={onUpdateEntry}
                onDelete={onDeleteEntry}
              />
            ))}
            {settledEntries.length > 0 && (
              <>
                <div className="mt-3 text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
                  Ya liquidadas
                </div>
                {settledEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-3 rounded-[18px] border border-[rgba(0,102,132,0.08)] bg-brand-neutral/60 px-3 py-2 text-sm text-brand-text-secondary"
                  >
                    <span>
                      {isoToAr(entry.workDate)} · {entry.hours} h · liquidada
                    </span>
                    {entry.appliedRate && (
                      <span className="text-brand-text-muted">
                        {entry.appliedCurrency} {entry.appliedRate}
                      </span>
                    )}
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(0,102,132,0.08)] pt-4">
        <span className="text-brand-text-secondary">
          {draftEntries.length} entradas sin liquidar ·{' '}
          <strong className="text-brand-text">{totalDraftHours} h</strong>
        </span>
        <button
          type="button"
          className={primaryButtonClassName}
          disabled={draftEntries.length === 0 || isSaving}
          onClick={() => {
            void onPreviewSettlement();
          }}
        >
          Liquidar período
        </button>
      </div>
    </article>
  );
}

function PeriodBoundaryInput(props: {
  label: string;
  value: string;
  onCommit: (iso: string) => void;
}) {
  const propValueAr = isoToAr(props.value);
  const [text, setText] = useState(propValueAr);
  const [error, setError] = useState<string | null>(null);

  // Sincroniza cuando el padre cambia el valor (ej. al cambiar preset),
  // evitando pisar lo que el usuario está escribiendo.
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
    props.onCommit(iso);
  }

  return (
    <label className="grid gap-1.5">
      <span className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
        {props.label}
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
      {error && (
        <span className="text-sm text-[rgb(130,44,25)]">{error}</span>
      )}
    </label>
  );
}

function PeriodPresetButton(props: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className={`${props.active ? primaryButtonClassName : secondaryButtonClassName}`}
      onClick={props.onClick}
    >
      {props.label}
    </button>
  );
}

function EntryRow(props: {
  entry: ReturnType<typeof useWorkedHoursRoute>['entries'][number];
  isSaving: boolean;
  onUpdate: ReturnType<typeof useWorkedHoursRoute>['handleUpdateEntry'];
  onDelete: ReturnType<typeof useWorkedHoursRoute>['handleDeleteEntry'];
}) {
  const { entry, isSaving, onUpdate, onDelete } = props;
  const [isEditing, setIsEditing] = useState(false);
  const [workDateAr, setWorkDateAr] = useState(isoToAr(entry.workDate));
  const [hours, setHours] = useState(entry.hours);
  const [notes, setNotes] = useState(entry.notes ?? '');
  const [dateError, setDateError] = useState<string | null>(null);

  async function submit(): Promise<void> {
    const iso = arToIso(workDateAr);
    if (!iso) {
      setDateError('Usá DD/MM/AAAA.');
      return;
    }
    setDateError(null);
    const ok = await onUpdate(entry.id, {
      workDate: iso,
      hours,
      notes: notes || undefined,
    });
    if (ok) setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className="grid gap-3 rounded-[18px] border border-[rgba(0,102,132,0.18)] bg-brand-primary/6 p-3 min-[780px]:grid-cols-[150px_110px_minmax(0,1fr)_auto]">
        <input
          className={inputClassName}
          type="text"
          inputMode="numeric"
          placeholder="DD/MM/AAAA"
          maxLength={10}
          value={workDateAr}
          onChange={(event) => {
            setWorkDateAr(event.target.value);
            if (dateError) setDateError(null);
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
            className={primaryButtonClassName}
            disabled={isSaving}
            onClick={() => {
              void submit();
            }}
          >
            Guardar
          </button>
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={() => setIsEditing(false)}
          >
            Cancelar
          </button>
        </div>
        {dateError && (
          <p className="text-sm text-[rgb(130,44,25)] min-[780px]:col-span-4">
            {dateError}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-[rgba(0,102,132,0.08)] bg-brand-neutral px-3 py-2">
      <div className="grid gap-0.5">
        <strong className="text-brand-text">
          {isoToAr(entry.workDate)} · {entry.hours} h
        </strong>
        {entry.notes && (
          <span className="text-sm text-brand-text-secondary">
            {entry.notes}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className={secondaryButtonClassName}
          onClick={() => setIsEditing(true)}
        >
          Editar
        </button>
        <button
          type="button"
          className={secondaryButtonClassName}
          disabled={isSaving}
          onClick={() => {
            void onDelete(entry.id);
          }}
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}

function SettlementsListCard(props: {
  settlements: ReturnType<typeof useWorkedHoursRoute>['settlements'];
  onOpen: ReturnType<typeof useWorkedHoursRoute>['handleOpenSettlement'];
}) {
  const { settlements, onOpen } = props;
  return (
    <article className={surfaceCardClassName}>
      <div className="mb-3">
        <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
          Historial de liquidaciones
        </span>
        <h2 className="mt-1 text-[1.2rem] font-bold tracking-[-0.04em] text-brand-text">
          {settlements.length} {settlements.length === 1 ? 'emitida' : 'emitidas'}
        </h2>
      </div>
      {settlements.length === 0 ? (
        <p className="text-brand-text-secondary">
          Aún no hay liquidaciones emitidas para este externo.
        </p>
      ) : (
        <ul className="grid gap-2">
          {settlements.map((settlement) => (
            <li key={settlement.id}>
              <button
                type="button"
                className="flex w-full flex-wrap items-center justify-between gap-3 rounded-[18px] border border-[rgba(0,102,132,0.08)] bg-brand-neutral px-3 py-2 text-left hover:border-[rgba(0,102,132,0.2)] hover:bg-white"
                onClick={() => {
                  void onOpen(settlement.id);
                }}
              >
                <span className="grid gap-0.5">
                  <strong className="text-brand-text">
                    {isoToAr(settlement.periodStart)} →{' '}
                    {isoToAr(settlement.periodEnd)}
                  </strong>
                  <span className="text-sm text-brand-text-secondary">
                    Emitida {isoToAr(settlement.issuedAt)}
                  </span>
                </span>
                <span
                  className={`${badgeBaseClassName} ${
                    settlement.status === 'paid'
                      ? 'bg-[rgba(20,108,56,0.1)] text-[rgb(20,108,56)]'
                      : settlement.status === 'cancelled'
                        ? 'bg-[rgba(168,43,17,0.1)] text-[rgb(130,44,25)]'
                        : 'bg-brand-primary/12 text-brand-primary'
                  }`}
                >
                  {settlement.status === 'paid'
                    ? 'Pagada'
                    : settlement.status === 'cancelled'
                      ? 'Cancelada'
                      : 'Emitida'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function PreviewPanel(props: {
  preview: NonNullable<ReturnType<typeof useWorkedHoursRoute>['preview']>;
  isSaving: boolean;
  onConfirm: ReturnType<typeof useWorkedHoursRoute>['handleIssue'];
  onCancel: () => void;
}) {
  const { preview, isSaving, onConfirm, onCancel } = props;
  const [notes, setNotes] = useState('');

  return (
    <section
      className={`${surfaceCardClassName} border-brand-primary/30 bg-white`}
      data-testid="worked-hours-preview"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
            Previsualización de liquidación
          </span>
          <h2 className="mt-1 text-[1.2rem] font-bold tracking-[-0.04em] text-brand-text">
            {isoToAr(preview.periodStart)} → {isoToAr(preview.periodEnd)}
          </h2>
        </div>
        <button
          type="button"
          className={secondaryButtonClassName}
          onClick={onCancel}
        >
          Cerrar
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-brand-text-muted">
              <th className="py-2">Fecha</th>
              <th>Horas</th>
              <th>Tarifa</th>
              <th className="text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {preview.lines.map((line) => (
              <tr
                key={line.entryId}
                className="border-t border-[rgba(0,102,132,0.08)]"
              >
                <td className="py-2">{isoToAr(line.workDate)}</td>
                <td>{line.hours}</td>
                <td>
                  {line.appliedCurrency} {line.appliedRate}
                </td>
                <td className="text-right text-brand-text">
                  {line.appliedCurrency} {line.subtotal}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-[rgba(0,102,132,0.18)] font-semibold text-brand-text">
              <td className="py-2">Totales</td>
              <td>{preview.totalHours}</td>
              <td></td>
              <td className="text-right">
                {preview.currency} {preview.totalAmount}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <label className="mt-4 grid gap-1.5">
        <span className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
          Nota (opcional)
        </span>
        <input
          className={inputClassName}
          type="text"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Aclaración para la liquidación"
        />
      </label>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          className={secondaryButtonClassName}
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button
          type="button"
          className={primaryButtonClassName}
          disabled={isSaving}
          onClick={() => {
            void onConfirm(notes || undefined);
          }}
        >
          {isSaving ? 'Emitiendo...' : 'Emitir liquidación'}
        </button>
      </div>
    </section>
  );
}

function SettlementDetailPanel(props: {
  detail: NonNullable<
    ReturnType<typeof useWorkedHoursRoute>['activeSettlement']
  >;
  memberName: string;
  isSaving: boolean;
  onClose: () => void;
  onMarkPaid: ReturnType<typeof useWorkedHoursRoute>['handleMarkPaid'];
  onCancel: ReturnType<typeof useWorkedHoursRoute>['handleCancelSettlement'];
}) {
  const { detail, memberName, isSaving, onClose, onMarkPaid, onCancel } = props;
  return (
    <section
      className={`${surfaceCardClassName} border-brand-primary/30 bg-white print:p-0`}
      data-testid="worked-hours-settlement-detail"
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3 print:flex-col">
        <div>
          <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary print:hidden">
            Liquidación
          </span>
          <h2 className="mt-1 text-[1.25rem] font-bold tracking-[-0.04em] text-brand-text">
            {memberName}
          </h2>
          <p className="mt-1 text-sm text-brand-text-secondary">
            Período {isoToAr(detail.periodStart)} →{' '}
            {isoToAr(detail.periodEnd)} · Emitida {isoToAr(detail.issuedAt)}
          </p>
          {detail.notes && (
            <p className="mt-1 text-sm text-brand-text-muted">
              Nota: {detail.notes}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={() => window.print()}
          >
            Imprimir
          </button>
          {detail.status === 'issued' && (
            <>
              <button
                type="button"
                className={primaryButtonClassName}
                disabled={isSaving}
                onClick={() => {
                  void onMarkPaid(detail.id);
                }}
              >
                Marcar pagada
              </button>
              <button
                type="button"
                className={secondaryButtonClassName}
                disabled={isSaving}
                onClick={() => {
                  void onCancel(detail.id);
                }}
              >
                Cancelar
              </button>
            </>
          )}
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-brand-text-muted">
              <th className="py-2">Fecha</th>
              <th>Horas</th>
              <th>Tarifa</th>
              <th className="text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {detail.lines.map((line) => (
              <tr
                key={line.entryId}
                className="border-t border-[rgba(0,102,132,0.08)]"
              >
                <td className="py-2">{isoToAr(line.workDate)}</td>
                <td>{line.hours}</td>
                <td>
                  {line.appliedCurrency} {line.appliedRate}
                </td>
                <td className="text-right text-brand-text">
                  {line.appliedCurrency} {line.subtotal}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-[rgba(0,102,132,0.18)] font-semibold text-brand-text">
              <td className="py-2">Totales</td>
              <td>{detail.totalHours}</td>
              <td></td>
              <td className="text-right">
                {detail.currency} {detail.totalAmount}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {detail.status === 'paid' && detail.paidAt && (
        <p className="mt-3 text-sm text-[rgb(20,108,56)]">
          Pagada el {isoToAr(detail.paidAt)}.
        </p>
      )}
      {detail.status === 'cancelled' && detail.cancelledAt && (
        <p className="mt-3 text-sm text-[rgb(130,44,25)]">
          Cancelada el {isoToAr(detail.cancelledAt)}. Las horas vuelven a
          estar disponibles como borrador.
        </p>
      )}
    </section>
  );
}
