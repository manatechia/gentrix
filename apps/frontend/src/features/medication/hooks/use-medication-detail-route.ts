import { useEffect, useMemo, useState } from 'react';

import type {
  MedicationCatalogItem,
  MedicationDetail,
  ResidentOverview,
} from '@gentrix/shared-types';

import { useAuthSession } from '../../auth/hooks/use-auth-session';
import type { DashboardScreenState } from '../../dashboard/types/dashboard-screen-state';
import {
  getApiErrorMessage,
  unwrapEnvelope,
} from '../../../shared/lib/api-envelope';
import * as medicationsService from '../services/medications-service';
import * as residentsService from '../../residents/services/residents-service';

function toResidentLabel(resident: ResidentOverview): string {
  return `${resident.fullName} - ${resident.room}`;
}

function toMedicationCatalogLabel(item: MedicationCatalogItem): string {
  return item.activeIngredient
    ? `${item.medicationName} (${item.activeIngredient})`
    : item.medicationName;
}

export function useMedicationDetailRoute(medicationId: string | undefined) {
  const auth = useAuthSession();
  const [screenState, setScreenState] =
    useState<DashboardScreenState>('loading');
  const [medication, setMedication] = useState<MedicationDetail | null>(null);
  const [medicationCatalogItems, setMedicationCatalogItems] = useState<
    MedicationCatalogItem[]
  >([]);
  const [residents, setResidents] = useState<ResidentOverview[]>([]);
  const [medicationError, setMedicationError] = useState<string | null>(null);

  function clearMedicationDetail(nextScreenState: DashboardScreenState): void {
    setMedication(null);
    setMedicationCatalogItems([]);
    setResidents([]);
    setMedicationError(null);
    setScreenState(nextScreenState);
  }

  async function loadMedicationDetail(): Promise<void> {
    if (!medicationId) {
      setMedication(null);
      setMedicationCatalogItems([]);
      setResidents([]);
      setMedicationError('No encontre la medicacion solicitada.');
      setScreenState('error');
      return;
    }

    if (!auth.token) {
      clearMedicationDetail('loading');
      return;
    }

    setScreenState('loading');
    setMedicationError(null);

    try {
      const [medicationPayload, medicationCatalogPayload, residentsPayload] =
        await Promise.all([
          medicationsService.getMedicationById(medicationId),
          medicationsService.getMedicationCatalog(),
          residentsService.getResidents(),
        ]);

      setMedication(unwrapEnvelope(medicationPayload));
      setMedicationCatalogItems(unwrapEnvelope(medicationCatalogPayload));
      setResidents(unwrapEnvelope(residentsPayload));
      setScreenState('ready');
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'No pude cargar el detalle del medicamento.',
      );

      if (message === 'Unauthorized.') {
        await auth.logout();
        return;
      }

      setMedication(null);
      setMedicationCatalogItems([]);
      setResidents([]);
      setMedicationError(message);
      setScreenState('error');
    }
  }

  useEffect(() => {
    if (auth.status !== 'authenticated' || !auth.token) {
      clearMedicationDetail('loading');
      return;
    }

    void loadMedicationDetail();
  }, [auth.status, auth.token, medicationId]);

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

  return {
    screenState,
    medication,
    medicationCatalogItems,
    residents,
    medicationError,
    residentCount: residents.length,
    residentOptions,
    medicationCatalogOptions,
    handleRetry: loadMedicationDetail,
  };
}
