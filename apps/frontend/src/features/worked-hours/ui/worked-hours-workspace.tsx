import { useState } from 'react';
import { Link } from 'react-router-dom';

import type { AuthSession } from '@gentrix/shared-types';

import {
  secondaryButtonClassName,
  shellCardClassName,
  surfaceCardClassName,
} from '../../../shared/ui/class-names';
import { WorkspaceShell } from '../../dashboard/ui/workspace-shell';
import { StatusNotice } from '../../dashboard/ui/status-notice';
import type { useWorkedHoursRoute } from '../hooks/use-worked-hours-route';
import { RateDrawer } from './rate-drawer';
import { SettlementDetailDrawer } from './settlement-detail-drawer';
import { SettlementDrawer } from './settlement-drawer';
import { StaffSettlementDetail } from './staff-settlement-detail';
import { StaffSettlementSelector } from './staff-settlement-selector';

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
    entries,
    settlements,
    period,
    notice,
    isSaving,
    activeSettlement,
    handleSelectExternal,
    handlePeriodChange,
    handleCreateRate,
    handleCreateEntry,
    handleUpdateEntry,
    handleDeleteEntry,
    handleIssue,
    handleOpenSettlement,
    handleMarkPaid,
    handleCloseSettlement,
    handleDismissNotice,
    handleRetry,
  } = route;

  const [isSettlementDrawerOpen, setIsSettlementDrawerOpen] = useState(false);
  const [isRateDrawerOpen, setIsRateDrawerOpen] = useState(false);

  async function handleIssueFromDrawer(
    notes: string | undefined,
  ): Promise<boolean> {
    const ok = await handleIssue(notes);
    if (ok) setIsSettlementDrawerOpen(false);
    return ok;
  }

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
              Personal
            </span>
            <h1 className="text-[clamp(2rem,3.2vw,2.6rem)] font-bold tracking-[-0.04em] text-brand-text">
              Horas y liquidaciones
            </h1>
            <p className="max-w-[64ch] leading-[1.6] text-brand-text-secondary">
              Gestioná las liquidaciones del personal externo. Las horas solo
              pueden cargarse si la persona tiene una tarifa vigente.
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
        <StatusNotice message="Cargando personal externo y sus liquidaciones…" />
      )}

      {screenState === 'error' && (
        <StatusNotice
          title="No se pudo cargar la pantalla."
          message={loadError ?? 'Ocurrió un error inesperado.'}
          actions={[
            { label: 'Reintentar', onClick: handleRetry },
            { label: 'Cerrar sesión', onClick: onLogout, variant: 'secondary' },
          ]}
        />
      )}

      {screenState === 'ready' && externals.length === 0 && (
        <section className={`${surfaceCardClassName}`}>
          <p className="leading-[1.6] text-brand-text-secondary">
            No hay personal externo cargado en esta organización. Creá uno
            desde la sección Personal para empezar a liquidar horas.
          </p>
        </section>
      )}

      {screenState === 'ready' && externals.length > 0 && (
        <section className="grid gap-[18px] min-[1181px]:grid-cols-[minmax(300px,0.7fr)_minmax(0,1.3fr)]">
          <StaffSettlementSelector
            externals={externals}
            selectedUserId={selectedUserId}
            onSelect={(userId) => {
              void handleSelectExternal(userId);
            }}
          />

          {selectedMember ? (
            <StaffSettlementDetail
              member={selectedMember}
              currentRate={currentRate}
              settlements={settlements}
              onNewSettlement={() => setIsSettlementDrawerOpen(true)}
              onOpenSettlement={(id) => {
                void handleOpenSettlement(id);
              }}
              onMarkPaidShortcut={(id) => {
                void handleOpenSettlement(id);
              }}
              onOpenRateDrawer={() => setIsRateDrawerOpen(true)}
            />
          ) : (
            <article className={surfaceCardClassName}>
              <p className="text-brand-text-secondary">
                Seleccioná una persona para ver su tarifa y sus liquidaciones.
              </p>
            </article>
          )}
        </section>
      )}

      {selectedMember && (
        <>
          <RateDrawer
            isOpen={isRateDrawerOpen}
            memberName={selectedMember.fullName}
            currentRate={currentRate}
            isSaving={isSaving}
            onClose={() => setIsRateDrawerOpen(false)}
            onCreate={handleCreateRate}
          />

          <SettlementDrawer
            isOpen={isSettlementDrawerOpen}
            member={selectedMember}
            currentRate={currentRate}
            period={period}
            entries={entries}
            isSaving={isSaving}
            onClose={() => setIsSettlementDrawerOpen(false)}
            onPeriodChange={handlePeriodChange}
            onCreateEntry={handleCreateEntry}
            onUpdateEntry={handleUpdateEntry}
            onDeleteEntry={handleDeleteEntry}
            onIssue={handleIssueFromDrawer}
          />
        </>
      )}

      <SettlementDetailDrawer
        isOpen={activeSettlement !== null}
        detail={activeSettlement}
        memberName={
          externals.find((member) => member.id === activeSettlement?.userId)
            ?.fullName ??
          selectedMember?.fullName ??
          ''
        }
        isSaving={isSaving}
        onClose={handleCloseSettlement}
        onMarkPaid={handleMarkPaid}
      />
    </WorkspaceShell>
  );
}
