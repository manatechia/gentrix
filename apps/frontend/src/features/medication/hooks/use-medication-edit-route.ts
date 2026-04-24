import { useState } from 'react';

import type { MedicationDetail } from '@gentrix/shared-types';

import { useAuthSession } from '../../auth/hooks/use-auth-session';
import {
  getApiErrorMessage,
  unwrapEnvelope,
} from '../../../shared/lib/api-envelope';
import { toMedicationUpsertInput } from '../lib/medication-form-adapter';
import * as medicationsService from '../services/medications-service';
import type { MedicationFormValues } from '../types/medication-form-values';
import { useMedicationDetailRoute } from './use-medication-detail-route';

export function useMedicationEditRoute(medicationId: string | undefined) {
  const auth = useAuthSession();
  const detail = useMedicationDetailRoute(medicationId);
  const [isSavingMedication, setIsSavingMedication] = useState(false);
  const [medicationNotice, setMedicationNotice] = useState<string | null>(null);
  const [medicationNoticeTone, setMedicationNoticeTone] = useState<
    'success' | 'error'
  >('success');

  async function handleMedicationUpdate(
    values: MedicationFormValues,
  ): Promise<MedicationDetail | null> {
    if (!medicationId) {
      setMedicationNoticeTone('error');
      setMedicationNotice('No se encontró la medicación solicitada.');
      return null;
    }

    if (!auth.token) {
      await auth.logout();
      return null;
    }

    setIsSavingMedication(true);
    setMedicationNotice(null);

    try {
      const payload = await medicationsService.updateMedication(
        medicationId,
        toMedicationUpsertInput(values),
      );
      const updatedMedication = unwrapEnvelope(payload);

      setMedicationNoticeTone('success');
      setMedicationNotice(
        `Orden de ${updatedMedication.medicationName} actualizada correctamente.`,
      );

      return updatedMedication;
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'No se pudo guardar los cambios de la medicación.',
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

  return {
    ...detail,
    isSavingMedication,
    medicationNotice,
    medicationNoticeTone,
    handleMedicationUpdate,
  };
}
