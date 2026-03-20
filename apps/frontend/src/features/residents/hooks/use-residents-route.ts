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
import {
  buildResidentCuit,
  toResidentDateIso,
} from '../lib/resident-form-utils';
import * as residentsService from '../services/residents-service';
import type {
  ResidentBooleanAnswer,
  ResidentFormValues,
} from '../types/resident-form-values';

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

function toOptionalString(value: string): string | undefined {
  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : undefined;
}

function toOptionalBoolean(
  value: ResidentBooleanAnswer,
): boolean | undefined {
  if (value === 'si') {
    return true;
  }

  if (value === 'no') {
    return false;
  }

  return undefined;
}

function toOptionalNumber(value: string): number | undefined {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  const parsedValue = Number.parseFloat(trimmedValue.replace(',', '.'));
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
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
        procedureNumber: toOptionalString(values.procedureNumber),
        cuil: buildResidentCuit(
          values.documentNumber,
          values.cuitPrefix,
          values.cuitSuffix,
        ),
        firstName: values.firstName.trim(),
        middleNames: values.middleNames.trim() || undefined,
        lastName: values.lastName.trim(),
        otherLastNames: values.otherLastNames.trim() || undefined,
        birthDate: toResidentDateIso(values.birthDate) ?? values.birthDate,
        admissionDate:
          toResidentDateIso(values.admissionDate) ?? values.admissionDate,
        sex: values.sex as ResidentSex,
        maritalStatus: toOptionalString(values.maritalStatus),
        nationality: toOptionalString(values.nationality),
        email: values.email.trim() || undefined,
        room: values.room.trim(),
        careLevel: values.careLevel,
        insurance: {
          provider: toOptionalString(values.insurance.provider),
          memberNumber: toOptionalString(values.insurance.memberNumber),
        },
        transfer: {
          provider: toOptionalString(values.transfer.provider),
          address: toOptionalString(values.transfer.address),
          phone: toOptionalString(values.transfer.phone),
        },
        psychiatry: {
          provider: toOptionalString(values.psychiatry.provider),
          careLocation: toOptionalString(values.psychiatry.careLocation),
          address: toOptionalString(values.psychiatry.address),
          phone: toOptionalString(values.psychiatry.phone),
        },
        clinicalProfile: {
          allergies: toOptionalString(values.clinicalProfile.allergies),
          emergencyCareLocation: toOptionalString(
            values.clinicalProfile.emergencyCareLocation,
          ),
          clinicalRecordNumber: toOptionalString(
            values.clinicalProfile.clinicalRecordNumber,
          ),
          primaryDoctorName: toOptionalString(
            values.clinicalProfile.primaryDoctorName,
          ),
          primaryDoctorOfficeAddress: toOptionalString(
            values.clinicalProfile.primaryDoctorOfficeAddress,
          ),
          primaryDoctorOfficePhone: toOptionalString(
            values.clinicalProfile.primaryDoctorOfficePhone,
          ),
          pathologies: toOptionalString(values.clinicalProfile.pathologies),
          surgeries: toOptionalString(values.clinicalProfile.surgeries),
          smokes: toOptionalBoolean(values.clinicalProfile.smokes),
          drinksAlcohol: toOptionalBoolean(
            values.clinicalProfile.drinksAlcohol,
          ),
          currentWeightKg: toOptionalNumber(
            values.clinicalProfile.currentWeightKg,
          ),
        },
        belongings: {
          glasses: values.belongings.glasses,
          dentures: values.belongings.dentures,
          walker: values.belongings.walker,
          orthopedicBed: values.belongings.orthopedicBed,
          notes: toOptionalString(values.belongings.notes),
        },
        familyContacts: values.familyContacts.map((contact) => ({
          fullName: contact.fullName.trim(),
          relationship: contact.relationship.trim(),
          phone: contact.phone.trim(),
          email: toOptionalString(contact.email),
          address: toOptionalString(contact.address),
          notes: toOptionalString(contact.notes),
        })),
        discharge: {
          date: values.discharge.date
            ? (toResidentDateIso(values.discharge.date) ?? values.discharge.date)
            : undefined,
          reason: toOptionalString(values.discharge.reason),
        },
        medicalHistory: values.medicalHistory.map((entry) => ({
          recordedAt: toResidentDateIso(entry.recordedAt) ?? entry.recordedAt,
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
