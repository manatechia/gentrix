import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import type {
  HourSettlement,
  HourSettlementDetail,
  HourSettlementIssueInput,
  HourSettlementPeriodInput,
  HourSettlementPreview,
  MembershipHourlyRate,
  MembershipHourlyRateCreateInput,
  TeamMemberOverview,
  WorkedHourEntry,
  WorkedHourEntryCreateInput,
  WorkedHourEntryUpdateInput,
} from '@gentrix/shared-types';

import { useAuthSession } from '../../auth/hooks/use-auth-session';
import {
  getApiErrorMessage,
  unwrapEnvelope,
} from '../../../shared/lib/api-envelope';
import * as teamService from '../../staff/services/staff-service';
import * as workedHoursService from '../services/worked-hours-service';

export type PeriodPreset = 'fortnight' | 'month' | 'custom';

/// Estado de carga de la pantalla completa (similar a otras routes).
export type ScreenState = 'loading' | 'ready' | 'error';

export interface PeriodSelection {
  preset: PeriodPreset;
  periodStart: string;
  periodEnd: string;
}

/// Devuelve el inicio y fin del período según el preset y la fecha de
/// referencia. Las quincenas siguen el criterio AR: 1–15 y 16–fin.
export function computePeriod(
  preset: PeriodPreset,
  reference: Date = new Date(),
): { periodStart: string; periodEnd: string } {
  const y = reference.getUTCFullYear();
  const m = reference.getUTCMonth();
  const d = reference.getUTCDate();
  const toIso = (date: Date) => date.toISOString().slice(0, 10);

  if (preset === 'fortnight') {
    if (d <= 15) {
      return {
        periodStart: toIso(new Date(Date.UTC(y, m, 1))),
        periodEnd: toIso(new Date(Date.UTC(y, m, 15))),
      };
    }
    return {
      periodStart: toIso(new Date(Date.UTC(y, m, 16))),
      periodEnd: toIso(new Date(Date.UTC(y, m + 1, 0))),
    };
  }
  if (preset === 'month') {
    return {
      periodStart: toIso(new Date(Date.UTC(y, m, 1))),
      periodEnd: toIso(new Date(Date.UTC(y, m + 1, 0))),
    };
  }
  // custom → "Día": un único día, start = end.
  const today = toIso(new Date(Date.UTC(y, m, d)));
  return { periodStart: today, periodEnd: today };
}

export function useWorkedHoursRoute() {
  const { logout, status, token } = useAuthSession();
  const [searchParams] = useSearchParams();
  const requestedExternalId = searchParams.get('externalId');
  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [team, setTeam] = useState<TeamMemberOverview[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [rates, setRates] = useState<MembershipHourlyRate[]>([]);
  const [entries, setEntries] = useState<WorkedHourEntry[]>([]);
  const [settlements, setSettlements] = useState<HourSettlement[]>([]);
  const [period, setPeriod] = useState<PeriodSelection>(() => {
    const computed = computePeriod('month');
    return { preset: 'month', ...computed };
  });
  const [notice, setNotice] = useState<{
    message: string;
    tone: 'success' | 'error';
  } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [preview, setPreview] = useState<HourSettlementPreview | null>(null);
  const [activeSettlement, setActiveSettlement] =
    useState<HourSettlementDetail | null>(null);

  const externals = useMemo(
    () => team.filter((member) => member.role === 'external'),
    [team],
  );

  const selectedMember = useMemo(
    () => externals.find((member) => member.id === selectedUserId) ?? null,
    [externals, selectedUserId],
  );

  const currentRate = useMemo(
    () => rates.find((rate) => rate.effectiveTo === null) ?? null,
    [rates],
  );

  const handleApiError = useCallback(
    async (error: unknown, fallback: string): Promise<string | null> => {
      const message = getApiErrorMessage(error, fallback);
      if (message === 'Unauthorized.') {
        await logout();
        return null;
      }
      return message;
    },
    [logout],
  );

  const loadExternal = useCallback(
    async (userId: string): Promise<void> => {
      try {
        const [ratesPayload, entriesPayload, settlementsPayload] =
          await Promise.all([
            workedHoursService.listHourlyRates(userId),
            workedHoursService.listHourEntries(userId, {
              from: period.periodStart,
              to: period.periodEnd,
            }),
            workedHoursService.listSettlements(userId),
          ]);
        setRates(unwrapEnvelope(ratesPayload));
        setEntries(unwrapEnvelope(entriesPayload));
        setSettlements(unwrapEnvelope(settlementsPayload));
      } catch (error) {
        const message = await handleApiError(
          error,
          'No se pudo cargar los datos del externo.',
        );
        if (message) {
          setNotice({ message, tone: 'error' });
        }
      }
    },
    [handleApiError, period.periodEnd, period.periodStart],
  );

  const loadRoute = useCallback(async (): Promise<void> => {
    if (!token) {
      setScreenState('loading');
      return;
    }
    setScreenState('loading');
    setLoadError(null);
    try {
      const teamPayload = await teamService.getTeam();
      const nextTeam = unwrapEnvelope(teamPayload);
      setTeam(nextTeam);
      const nextExternals = nextTeam.filter(
        (member) => member.role === 'external',
      );
      const nextSelected =
        (requestedExternalId &&
          nextExternals.find((member) => member.id === requestedExternalId)
            ?.id) ||
        nextExternals.find((member) => member.id === selectedUserId)?.id ||
        nextExternals[0]?.id ||
        null;
      setSelectedUserId(nextSelected);
      if (nextSelected) {
        await loadExternal(nextSelected);
      } else {
        setRates([]);
        setEntries([]);
        setSettlements([]);
      }
      setScreenState('ready');
    } catch (error) {
      const message = await handleApiError(
        error,
        'No se pudo cargar el listado de externos.',
      );
      if (message) {
        setLoadError(message);
        setScreenState('error');
      }
    }
  }, [handleApiError, loadExternal, requestedExternalId, selectedUserId, token]);

  const handleSelectExternal = useCallback(
    async (userId: string): Promise<void> => {
      if (userId === selectedUserId) return;
      setSelectedUserId(userId);
      setNotice(null);
      setPreview(null);
      // Cerrar detalle de liquidación abierto: pertenece al externo anterior
      // y quedarse pegado genera confusión (nombre en el header no matcha).
      setActiveSettlement(null);
      await loadExternal(userId);
    },
    [loadExternal, selectedUserId],
  );

  const handlePeriodChange = useCallback(
    async (next: PeriodSelection): Promise<void> => {
      setPeriod(next);
      if (!selectedUserId) return;
      try {
        const entriesPayload = await workedHoursService.listHourEntries(
          selectedUserId,
          { from: next.periodStart, to: next.periodEnd },
        );
        setEntries(unwrapEnvelope(entriesPayload));
      } catch (error) {
        const message = await handleApiError(
          error,
          'No se pudo recargar las horas del período.',
        );
        if (message) setNotice({ message, tone: 'error' });
      }
    },
    [handleApiError, selectedUserId],
  );

  const handleCreateRate = useCallback(
    async (input: MembershipHourlyRateCreateInput): Promise<boolean> => {
      if (!selectedUserId) return false;
      setIsSaving(true);
      setNotice(null);
      try {
        await workedHoursService.createHourlyRate(selectedUserId, input);
        await loadExternal(selectedUserId);
        setNotice({ message: 'Tarifa actualizada.', tone: 'success' });
        return true;
      } catch (error) {
        const message = await handleApiError(
          error,
          'No se pudo guardar la tarifa.',
        );
        if (message) setNotice({ message, tone: 'error' });
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [handleApiError, loadExternal, selectedUserId],
  );

  const handleCreateEntry = useCallback(
    async (input: WorkedHourEntryCreateInput): Promise<boolean> => {
      if (!selectedUserId) return false;
      setIsSaving(true);
      setNotice(null);
      try {
        await workedHoursService.createHourEntry(selectedUserId, input);
        await loadExternal(selectedUserId);
        setNotice({ message: 'Horas cargadas.', tone: 'success' });
        return true;
      } catch (error) {
        const message = await handleApiError(
          error,
          'No se pudo cargar las horas.',
        );
        if (message) setNotice({ message, tone: 'error' });
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [handleApiError, loadExternal, selectedUserId],
  );

  const handleUpdateEntry = useCallback(
    async (
      entryId: string,
      input: WorkedHourEntryUpdateInput,
    ): Promise<boolean> => {
      setIsSaving(true);
      setNotice(null);
      try {
        await workedHoursService.updateHourEntry(entryId, input);
        if (selectedUserId) await loadExternal(selectedUserId);
        setNotice({ message: 'Entrada actualizada.', tone: 'success' });
        return true;
      } catch (error) {
        const message = await handleApiError(
          error,
          'No se pudo actualizar la entrada.',
        );
        if (message) setNotice({ message, tone: 'error' });
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [handleApiError, loadExternal, selectedUserId],
  );

  const handleDeleteEntry = useCallback(
    async (entryId: string): Promise<boolean> => {
      setIsSaving(true);
      setNotice(null);
      try {
        await workedHoursService.deleteHourEntry(entryId);
        if (selectedUserId) await loadExternal(selectedUserId);
        setNotice({ message: 'Entrada eliminada.', tone: 'success' });
        return true;
      } catch (error) {
        const message = await handleApiError(
          error,
          'No se pudo eliminar la entrada.',
        );
        if (message) setNotice({ message, tone: 'error' });
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [handleApiError, loadExternal, selectedUserId],
  );

  const handlePreview = useCallback(async (): Promise<void> => {
    if (!selectedUserId) return;
    setNotice(null);
    try {
      const payload = await workedHoursService.previewSettlement(
        selectedUserId,
        {
          periodStart: period.periodStart,
          periodEnd: period.periodEnd,
        } as HourSettlementPeriodInput,
      );
      setPreview(unwrapEnvelope(payload));
    } catch (error) {
      const message = await handleApiError(
        error,
        'No se pudo generar la vista previa de la liquidación.',
      );
      if (message) setNotice({ message, tone: 'error' });
    }
  }, [handleApiError, period.periodEnd, period.periodStart, selectedUserId]);

  const handleIssue = useCallback(
    async (notes: string | undefined): Promise<boolean> => {
      if (!selectedUserId) return false;
      setIsSaving(true);
      setNotice(null);
      try {
        const payload = await workedHoursService.issueSettlement(
          selectedUserId,
          {
            periodStart: period.periodStart,
            periodEnd: period.periodEnd,
            notes,
          } as HourSettlementIssueInput,
        );
        const detail = unwrapEnvelope(payload);
        setPreview(null);
        if (selectedUserId) await loadExternal(selectedUserId);
        setNotice({
          message: `Liquidación emitida por ${detail.currency} ${detail.totalAmount}.`,
          tone: 'success',
        });
        return true;
      } catch (error) {
        const message = await handleApiError(
          error,
          'No se pudo emitir la liquidación.',
        );
        if (message) setNotice({ message, tone: 'error' });
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [
      handleApiError,
      loadExternal,
      period.periodEnd,
      period.periodStart,
      selectedUserId,
    ],
  );

  const handleOpenSettlement = useCallback(
    async (settlementId: string): Promise<void> => {
      setNotice(null);
      try {
        const payload =
          await workedHoursService.getSettlementDetail(settlementId);
        setActiveSettlement(unwrapEnvelope(payload));
      } catch (error) {
        const message = await handleApiError(
          error,
          'No se pudo abrir la liquidación.',
        );
        if (message) setNotice({ message, tone: 'error' });
      }
    },
    [handleApiError],
  );

  const handleMarkPaid = useCallback(
    async (settlementId: string): Promise<void> => {
      setIsSaving(true);
      try {
        const payload =
          await workedHoursService.markSettlementPaid(settlementId);
        setActiveSettlement(unwrapEnvelope(payload));
        if (selectedUserId) await loadExternal(selectedUserId);
        setNotice({ message: 'Liquidación marcada como pagada.', tone: 'success' });
      } catch (error) {
        const message = await handleApiError(
          error,
          'No se pudo marcar la liquidación como pagada.',
        );
        if (message) setNotice({ message, tone: 'error' });
      } finally {
        setIsSaving(false);
      }
    },
    [handleApiError, loadExternal, selectedUserId],
  );

  const handleCancelSettlement = useCallback(
    async (settlementId: string): Promise<void> => {
      setIsSaving(true);
      try {
        const payload =
          await workedHoursService.cancelSettlement(settlementId);
        setActiveSettlement(unwrapEnvelope(payload));
        if (selectedUserId) await loadExternal(selectedUserId);
        setNotice({ message: 'Liquidación cancelada.', tone: 'success' });
      } catch (error) {
        const message = await handleApiError(
          error,
          'No se pudo cancelar la liquidación.',
        );
        if (message) setNotice({ message, tone: 'error' });
      } finally {
        setIsSaving(false);
      }
    },
    [handleApiError, loadExternal, selectedUserId],
  );

  useEffect(() => {
    if (status !== 'authenticated' || !token) {
      setScreenState('loading');
      return;
    }
    void loadRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, token]);

  return {
    screenState,
    loadError,
    externals,
    selectedMember,
    selectedUserId,
    rates,
    currentRate,
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
    handleCloseSettlement: () => setActiveSettlement(null),
    handleClosePreview: () => setPreview(null),
    handleDismissNotice: () => setNotice(null),
    handleRetry: loadRoute,
  };
}
