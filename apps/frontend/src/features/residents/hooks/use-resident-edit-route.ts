import { useState } from 'react';

import type { ResidentDetail } from '@gentrix/shared-types';

import { useAuthSession } from '../../auth/hooks/use-auth-session';
import {
  getApiErrorMessage,
  unwrapEnvelope,
} from '../../../shared/lib/api-envelope';
import { toResidentUpdateInput } from '../lib/resident-form-adapter';
import * as residentsService from '../services/residents-service';
import type { ResidentFormValues } from '../types/resident-form-values';
import { useResidentDetailRoute } from './use-resident-detail-route';

export function useResidentEditRoute(residentId: string | undefined) {
  const auth = useAuthSession();
  const detail = useResidentDetailRoute(residentId);
  const [isSavingResident, setIsSavingResident] = useState(false);
  const [residentNotice, setResidentNotice] = useState<string | null>(null);
  const [residentNoticeTone, setResidentNoticeTone] = useState<
    'success' | 'error'
  >('success');

  async function handleResidentUpdate(
    values: ResidentFormValues,
  ): Promise<ResidentDetail | null> {
    if (!residentId) {
      setResidentNoticeTone('error');
      setResidentNotice('No se encontró el residente solicitado.');
      return null;
    }

    if (!auth.token) {
      await auth.logout();
      return null;
    }

    setIsSavingResident(true);
    setResidentNotice(null);

    try {
      const payload = await residentsService.updateResident(
        residentId,
        toResidentUpdateInput(values),
      );
      const updatedResident = unwrapEnvelope(payload);

      setResidentNoticeTone('success');
      setResidentNotice(
        `Paciente ${updatedResident.fullName} actualizado correctamente.`,
      );

      return updatedResident;
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'No se pudo guardar los cambios del paciente.',
      );

      if (message === 'Unauthorized.') {
        await auth.logout();
        return null;
      }

      setResidentNoticeTone('error');
      setResidentNotice(message);
      throw error;
    } finally {
      setIsSavingResident(false);
    }
  }

  return {
    ...detail,
    isSavingResident,
    residentNotice,
    residentNoticeTone,
    handleResidentUpdate,
  };
}
