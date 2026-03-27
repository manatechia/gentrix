import { useCallback, useEffect, useMemo, useState } from 'react';

import type {
  MedicationCatalogItem,
  MedicationExecutionOverview,
  MedicationExecutionResult,
  MedicationOverview,
  ResidentOverview,
} from '@gentrix/shared-types';

import { useAuthSession } from '../../auth/hooks/use-auth-session';
import type { DashboardScreenState } from '../../dashboard/types/dashboard-screen-state';
import {
  getApiErrorMessage,
  unwrapEnvelope,
} from '../../../shared/lib/api-envelope';
import { formatMedicationExecutionResult } from '../../../shared/lib/display-labels';
import { toMedicationUpsertInput } from '../lib/medication-form-adapter';
import * as medicationsService from '../services/medications-service';
import * as residentsService from '../../residents/services/residents-service';
import type { MedicationFormValues } from '../types/medication-form-values';

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

function sortExecutionsDesc(
  executions: ReadonlyArray<MedicationExecutionOverview>,
): MedicationExecutionOverview[] {
  return [...executions].sort(
    (left, right) =>
      new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
  );
}

function toResidentLabel(resident: ResidentOverview): string {
  return `${resident.fullName} - ${resident.room}`;
}

function toMedicationCatalogLabel(item: MedicationCatalogItem): string {
  return item.activeIngredient
    ? `${item.medicationName} (${item.activeIngredient})`
    : item.medicationName;
}

function toMedicationExecutionNoticeLabel(
  result: MedicationExecutionResult,
): string {
  return formatMedicationExecutionResult(result).toLowerCase();
}

export function useMedicationsRoute() {
  const { logout, status, token } = useAuthSession();
  const [screenState, setScreenState] =
    useState<DashboardScreenState>('loading');
  const [medications, setMedications] = useState<MedicationOverview[]>([]);
  const [medicationCatalogItems, setMedicationCatalogItems] = useState<
    MedicationCatalogItem[]
  >([]);
  const [residents, setResidents] = useState<ResidentOverview[]>([]);
  const [medicationExecutionsByMedicationId, setMedicationExecutionsByMedicationId] =
    useState<Record<string, MedicationExecutionOverview[]>>({});
  const [medicationsError, setMedicationsError] = useState<string | null>(null);
  const [isSavingMedication, setIsSavingMedication] = useState(false);
  const [recordingMedicationExecutionId, setRecordingMedicationExecutionId] =
    useState<string | null>(null);
  const [medicationNotice, setMedicationNotice] = useState<string | null>(null);
  const [medicationNoticeTone, setMedicationNoticeTone] = useState<
    'success' | 'error'
  >('success');

  function clearMedicationContext(nextScreenState: DashboardScreenState): void {
    setMedications([]);
    setMedicationCatalogItems([]);
    setResidents([]);
    setMedicationExecutionsByMedicationId({});
    setMedicationsError(null);
    setRecordingMedicationExecutionId(null);
    setScreenState(nextScreenState);
  }

  const buildMedicationExecutionsMap = useCallback(
    async (
      nextMedications: ReadonlyArray<MedicationOverview>,
    ): Promise<Record<string, MedicationExecutionOverview[]>> => {
      if (nextMedications.length === 0) {
        return {};
      }

      const executionEntries = await Promise.all(
        nextMedications.map(async (medication) => {
          const payload =
            await medicationsService.getMedicationExecutionsByMedicationId(
              medication.id,
            );

          return [
            medication.id,
            sortExecutionsDesc(dedupeById(unwrapEnvelope(payload))),
          ] as const;
        }),
      );

      return Object.fromEntries(executionEntries);
    },
    [],
  );

  const fetchMedicationsContextSnapshot = useCallback(async () => {
    const [medicationsPayload, medicationCatalogPayload, residentsPayload] =
      await Promise.all([
        medicationsService.getMedications(),
        medicationsService.getMedicationCatalog(),
        residentsService.getResidents(),
      ]);
    const nextMedications = dedupeById(unwrapEnvelope(medicationsPayload));
    const nextMedicationCatalogItems = dedupeById(
      unwrapEnvelope(medicationCatalogPayload),
    );
    const nextResidents = dedupeById(unwrapEnvelope(residentsPayload));
    const nextMedicationExecutionsByMedicationId =
      await buildMedicationExecutionsMap(nextMedications);

    return {
      medications: nextMedications,
      medicationCatalogItems: nextMedicationCatalogItems,
      residents: nextResidents,
      medicationExecutionsByMedicationId: nextMedicationExecutionsByMedicationId,
    };
  }, [buildMedicationExecutionsMap]);

  const loadMedicationsContext = useCallback(async (): Promise<void> => {
    if (!token) {
      clearMedicationContext('loading');
      return;
    }

    setScreenState('loading');
    setMedicationsError(null);

    try {
      const snapshot = await fetchMedicationsContextSnapshot();

      setMedications(snapshot.medications);
      setMedicationCatalogItems(snapshot.medicationCatalogItems);
      setResidents(snapshot.residents);
      setMedicationExecutionsByMedicationId(
        snapshot.medicationExecutionsByMedicationId,
      );
      setScreenState('ready');
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'No pude cargar el modulo de medicacion.',
      );

      if (message === 'Unauthorized.') {
        await logout();
        return;
      }

      setMedicationsError(message);
      setScreenState('error');
    }
  }, [fetchMedicationsContextSnapshot, logout, token]);

  useEffect(() => {
    if (status !== 'authenticated' || !token) {
      clearMedicationContext('loading');
      return;
    }

    void loadMedicationsContext();
  }, [loadMedicationsContext, status, token]);

  const refreshMedicationsInPlace = useCallback(async (): Promise<void> => {
    const snapshot = await fetchMedicationsContextSnapshot();

    setMedications(snapshot.medications);
    setMedicationCatalogItems(snapshot.medicationCatalogItems);
    setResidents(snapshot.residents);
    setMedicationExecutionsByMedicationId(
      snapshot.medicationExecutionsByMedicationId,
    );
    setMedicationsError(null);
    setScreenState('ready');
  }, [fetchMedicationsContextSnapshot]);

  async function handleMedicationCreate(
    values: MedicationFormValues,
  ): Promise<MedicationOverview | null> {
    if (!token) {
      await logout();
      return null;
    }

    setIsSavingMedication(true);
    setMedicationNotice(null);

    try {
      const payload = await medicationsService.createMedication(
        toMedicationUpsertInput(values),
      );
      const createdMedication = unwrapEnvelope(payload);

      setMedications((current) => dedupeById([createdMedication, ...current]));
      setMedicationNoticeTone('success');
      setMedicationNotice(
        `Orden de ${createdMedication.medicationName} guardada correctamente.`,
      );

      void refreshMedicationsInPlace().catch(() => {
        // Preserve the optimistic list update if the background refresh fails.
      });

      return createdMedication;
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'No pude guardar la orden de medicacion.',
      );

      if (message === 'Unauthorized.') {
        await logout();
        return null;
      }

      setMedicationNoticeTone('error');
      setMedicationNotice(message);
      throw error;
    } finally {
      setIsSavingMedication(false);
    }
  }

  async function handleMedicationExecutionCreate(
    medication: MedicationOverview,
    result: MedicationExecutionResult,
  ): Promise<MedicationExecutionOverview | null> {
    if (!token) {
      await logout();
      return null;
    }

    setRecordingMedicationExecutionId(medication.id);
    setMedicationNotice(null);

    try {
      const payload = await medicationsService.createMedicationExecution(
        medication.id,
        {
          occurredAt: new Date().toISOString(),
          result,
        },
      );
      const createdExecution = unwrapEnvelope(payload);

      setMedicationExecutionsByMedicationId((current) => ({
        ...current,
        [medication.id]: sortExecutionsDesc(
          dedupeById([createdExecution, ...(current[medication.id] ?? [])]),
        ),
      }));
      setMedicationNoticeTone('success');
      setMedicationNotice(
        `Toma de ${createdExecution.medicationName} registrada como ${toMedicationExecutionNoticeLabel(createdExecution.result)}.`,
      );

      void refreshMedicationsInPlace().catch(() => {
        // Preserve the optimistic execution update if the background refresh fails.
      });

      return createdExecution;
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'No pude registrar la ejecucion de medicacion.',
      );

      if (message === 'Unauthorized.') {
        await logout();
        return null;
      }

      setMedicationNoticeTone('error');
      setMedicationNotice(message);
      throw error;
    } finally {
      setRecordingMedicationExecutionId(null);
    }
  }

  const residentOptions = useMemo(
    () =>
      residents.map((resident) => ({
        value: resident.id,
        label: toResidentLabel(resident),
      })),
    [residents],
  );

  const medicationCatalogOptions = useMemo(
    () =>
      medicationCatalogItems.map((item) => ({
        value: item.id,
        label: toMedicationCatalogLabel(item),
      })),
    [medicationCatalogItems],
  );

  const activeMedicationCount = useMemo(
    () => medications.filter((medication) => medication.active).length,
    [medications],
  );

  return {
    screenState,
    medications,
    medicationCatalogItems,
    residents,
    medicationExecutionsByMedicationId,
    residentOptions,
    medicationCatalogOptions,
    medicationsError,
    isSavingMedication,
    recordingMedicationExecutionId,
    medicationNotice,
    medicationNoticeTone,
    residentCount: residents.length,
    medicationCount: medications.length,
    activeMedicationCount,
    handleRetry: loadMedicationsContext,
    handleMedicationCreate,
    handleMedicationExecutionCreate,
  };
}
