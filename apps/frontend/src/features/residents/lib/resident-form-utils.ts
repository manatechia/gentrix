import type { ResidentAttachmentKind } from '@gentrix/shared-types';
import { calculateAge, createRandomEntityId } from '@gentrix/shared-utils';

import type {
  ResidentAttachmentFormValue,
  ResidentMedicalHistoryFormValue,
} from '../types/resident-form-values';

export const maxResidentAttachmentCount = 6;
export const maxResidentAttachmentSizeBytes = 5_000_000;

function resolveResidentAttachmentKind(mimeType: string): ResidentAttachmentKind {
  return mimeType === 'application/pdf' ? 'pdf' : 'image';
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('No pude leer el archivo seleccionado.'));
        return;
      }

      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(new Error('No pude leer el archivo seleccionado.'));
    };

    reader.readAsDataURL(file);
  });
}

export function createEmptyMedicalHistoryEntry(): ResidentMedicalHistoryFormValue {
  return {
    localId: createRandomEntityId(),
    recordedAt: '',
    title: '',
    notes: '',
  };
}

export function formatResidentAttachmentSize(sizeBytes: number): string {
  if (sizeBytes >= 1_000_000) {
    return `${(sizeBytes / 1_000_000).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(sizeBytes / 1_000))} KB`;
}

export async function toResidentAttachmentFormValue(
  file: File,
): Promise<ResidentAttachmentFormValue> {
  const mimeType = file.type.trim().toLowerCase();
  const isAllowedMimeType =
    mimeType === 'application/pdf' || mimeType.startsWith('image/');

  if (!isAllowedMimeType) {
    throw new Error('Solo se permiten archivos de imagen o PDF.');
  }

  if (file.size > maxResidentAttachmentSizeBytes) {
    throw new Error('Cada adjunto puede pesar hasta 5 MB.');
  }

  return {
    localId: createRandomEntityId(),
    fileName: file.name,
    mimeType,
    sizeBytes: file.size,
    dataUrl: await readFileAsDataUrl(file),
    kind: resolveResidentAttachmentKind(mimeType),
  };
}

export function formatResidentDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function toResidentBirthDateIso(value: string): string | null {
  if (!value) {
    return null;
  }

  const formattedValue = formatResidentDateInput(value);
  const match = formattedValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) {
    return null;
  }

  const [, dayToken, monthToken, yearToken] = match;
  const day = Number.parseInt(dayToken, 10);
  const month = Number.parseInt(monthToken, 10);
  const year = Number.parseInt(yearToken, 10);

  if (
    !Number.isInteger(day) ||
    !Number.isInteger(month) ||
    !Number.isInteger(year) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  const parsed = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return parsed.toISOString();
}

export function isResidentDateInFuture(value: string): boolean {
  const isoDate = toResidentBirthDateIso(value);

  if (!isoDate) {
    return false;
  }

  const inputDay = isoDate.slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  return inputDay > today;
}

export function getResidentAgeFromBirthDate(value: string): number | null {
  const isoDate = toResidentBirthDateIso(value);

  if (!isoDate) {
    return null;
  }

  return Math.max(calculateAge(isoDate), 0);
}
