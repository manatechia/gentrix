import { useEffect, useMemo, useState } from 'react';

import type {
  MedicationCatalogItem,
  MedicationOverview,
  ResidentOverview,
} from '@gentrix/shared-types';

import { useAuthSession } from '../../auth/hooks/use-auth-session';
import type { DashboardScreenState } from '../../dashboard/types/dashboard-screen-state';
import {
  getApiErrorMessage,
  unwrapEnvelope,
} from '../../../shared/lib/api-envelope';
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

function toResidentLabel(resident: ResidentOverview): string {
  return `${resident.fullName} - ${resident.room}`;
}

function toMedicationCatalogLabel(item: MedicationCatalogItem): string {
  return item.activeIngredient
    ? `${item.medicationName} (${item.activeIngredient})`
    : item.medicationName;
}

export function useMedicationsRoute() {
  const auth = useAuthSession();
  const [screenState, setScreenState] =
    useState<DashboardScreenState>('loading');
  const [medications, setMedications] = useState<MedicationOverview[]>([]);
  const [medicationCatalogItems, setMedicationCatalogItems] = useState<
    MedicationCatalogItem[]
  >([]);
  const [residents, setResidents] = useState<ResidentOverview[]>([]);
  const [medicationsError, setMedicationsError] = useState<string | null>(null);
  const [isSavingMedication, setIsSavingMedication] = useState(false);
  const [medicationNotice, setMedicationNotice] = useState<string | null>(null);
  const [medicationNoticeTone, setMedicationNoticeTone] = useState<
    'success' | 'error'
  >('success');

  function clearMedicationContext(nextScreenState: DashboardScreenState): void {
    setMedications([]);
    setMedicationCatalogItems([]);
    setResidents([]);
    setMedicationsError(null);
    setScreenState(nextScreenState);
  }

  async function loadMedicationsContext(): Promise<void> {
    if (!auth.token) {
      clearMedicationContext('loading');
      return;
    }

    setScreenState('loading');
    setMedicationsError(null);

    try {
      const [medicationsPayload, medicationCatalogPayload, residentsPayload] =
        await Promise.all([
          medicationsService.getMedications(),
          medicationsService.getMedicationCatalog(),
          residentsService.getResidents(),
        ]);

      setMedications(dedupeById(unwrapEnvelope(medicationsPayload)));
      setMedicationCatalogItems(
        dedupeById(unwrapEnvelope(medicationCatalogPayload)),
      );
      setResidents(dedupeById(unwrapEnvelope(residentsPayload)));
      setScreenState('ready');
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'No pude cargar el modulo de medicacion.',
      );

      if (message === 'Unauthorized.') {
        await auth.logout();
        return;
      }

      setMedicationsError(message);
      setScreenState('error');
    }
  }

  useEffect(() => {
    if (auth.status !== 'authenticated' || !auth.token) {
      clearMedicationContext('loading');
      return;
    }

    void loadMedicationsContext();
  }, [auth.status, auth.token]);

  async function refreshMedicationsInPlace(): Promise<void> {
    const [medicationsPayload, medicationCatalogPayload, residentsPayload] =
      await Promise.all([
        medicationsService.getMedications(),
        medicationsService.getMedicationCatalog(),
        residentsService.getResidents(),
      ]);

    setMedications(dedupeById(unwrapEnvelope(medicationsPayload)));
    setMedicationCatalogItems(
      dedupeById(unwrapEnvelope(medicationCatalogPayload)),
    );
    setResidents(dedupeById(unwrapEnvelope(residentsPayload)));
    setMedicationsError(null);
    setScreenState('ready');
  }

  async function handleMedicationCreate(
    values: MedicationFormValues,
  ): Promise<MedicationOverview | null> {
    if (!auth.token) {
      await auth.logout();
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
        await auth.logout();
        return null;
      }

      setMedicationNoticeTone('error');
      setMedicationNotice(message);
      throw error;
    } finally {
      setIsSavingMedication(false);
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
    residentOptions,
    medicationCatalogOptions,
    medicationsError,
    isSavingMedication,
    medicationNotice,
    medicationNoticeTone,
    residentCount: residents.length,
    medicationCount: medications.length,
    activeMedicationCount,
    handleRetry: loadMedicationsContext,
    handleMedicationCreate,
  };
}
