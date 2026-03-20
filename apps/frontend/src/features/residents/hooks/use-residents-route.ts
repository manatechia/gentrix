import { useEffect, useMemo, useState } from 'react';

import type {
  ResidentCreateInput,
  ResidentDocumentType,
  ResidentOverview,
  ResidentSex,
} from '@gentrix/shared-types';

import { useAuthSession } from '../../auth/hooks/use-auth-session';
import {
  getApiErrorMessage,
  unwrapEnvelope,
} from '../../../shared/lib/api-envelope';
import type { DashboardScreenState } from '../../dashboard/types/dashboard-screen-state';
import { toResidentBirthDateIso } from '../lib/resident-form-utils';
import * as residentsService from '../services/residents-service';
import type { ResidentFormValues } from '../types/resident-form-values';

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

export function useResidentsRoute() {
  const auth = useAuthSession();
  const [screenState, setScreenState] =
    useState<DashboardScreenState>('loading');
  const [residents, setResidents] = useState<ResidentOverview[]>([]);
  const [residentsError, setResidentsError] = useState<string | null>(null);
  const [isSavingResident, setIsSavingResident] = useState(false);
  const [residentNotice, setResidentNotice] = useState<string | null>(null);
  const [residentNoticeTone, setResidentNoticeTone] = useState<
    'success' | 'error'
  >('success');

  async function loadResidents(): Promise<void> {
    if (!auth.token) {
      setResidents([]);
      setResidentsError(null);
      setScreenState('loading');
      return;
    }

    setScreenState('loading');
    setResidentsError(null);

    try {
      const payload = await residentsService.getResidents();
      setResidents(dedupeById(unwrapEnvelope(payload)));
      setScreenState('ready');
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'No pude cargar los residentes.',
      );

      if (message === 'Unauthorized.') {
        await auth.logout();
        return;
      }

      setResidentsError(message);
      setScreenState('error');
    }
  }

  useEffect(() => {
    if (auth.status !== 'authenticated' || !auth.token) {
      setResidents([]);
      setResidentsError(null);
      setScreenState('loading');
      return;
    }

    void loadResidents();
  }, [auth.status, auth.token]);

  async function refreshResidentsInPlace(): Promise<void> {
    const payload = await residentsService.getResidents();
    setResidents(dedupeById(unwrapEnvelope(payload)));
    setResidentsError(null);
    setScreenState('ready');
  }

  async function handleResidentCreate(
    values: ResidentFormValues,
  ): Promise<ResidentOverview | null> {
    if (!auth.token) {
      await auth.logout();
      return null;
    }

    setIsSavingResident(true);
    setResidentNotice(null);

    try {
      const residentInput: ResidentCreateInput = {
        documentType: values.documentType as ResidentDocumentType,
        documentNumber: values.documentNumber.trim(),
        documentIssuingCountry: values.documentIssuingCountry.trim(),
        firstName: values.firstName.trim(),
        middleNames: values.middleNames.trim() || undefined,
        lastName: values.lastName.trim(),
        otherLastNames: values.otherLastNames.trim() || undefined,
        birthDate: toResidentBirthDateIso(values.birthDate) ?? values.birthDate,
        sex: values.sex as ResidentSex,
        email: values.email.trim() || undefined,
        room: values.room.trim(),
        careLevel: values.careLevel,
        medicalHistory: values.medicalHistory.map((entry) => ({
          recordedAt:
            toResidentBirthDateIso(entry.recordedAt) ?? entry.recordedAt,
          title: entry.title.trim(),
          notes: entry.notes.trim(),
        })),
        attachments: values.attachments.map((attachment) => ({
          fileName: attachment.fileName,
          mimeType: attachment.mimeType,
          sizeBytes: attachment.sizeBytes,
          dataUrl: attachment.dataUrl,
        })),
      };

      const payload = await residentsService.createResident(residentInput);
      const createdResident = unwrapEnvelope(payload);

      setResidents((current) => dedupeById([createdResident, ...current]));
      setResidentNoticeTone('success');
      setResidentNotice(`Paciente ${createdResident.fullName} guardado correctamente.`);

      void refreshResidentsInPlace().catch(() => {
        // Keep the optimistic update visible if the background sync fails.
      });

      return createdResident;
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'No pude guardar el paciente.',
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

  const memoryCareResidents = useMemo(
    () =>
      residents.filter((resident) => resident.careLevel === 'memory-care')
        .length,
    [residents],
  );

  return {
    screenState,
    residents,
    residentsError,
    isSavingResident,
    residentNotice,
    residentNoticeTone,
    residentCount: residents.length,
    memoryCareResidents,
    handleRetry: loadResidents,
    handleResidentCreate,
  };
}
