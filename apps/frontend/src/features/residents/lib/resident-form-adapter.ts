import type {
  ResidentCreateInput,
  ResidentDetail,
  ResidentDocumentType,
  ResidentSex,
  ResidentUpdateInput,
} from '@gentrix/shared-types';

import { buildResidentCuit, toResidentDateIso } from './resident-form-utils';
import type {
  ResidentBooleanAnswer,
  ResidentFormValues,
} from '../types/resident-form-values';

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

function formatResidentIsoDateForInput(value: string | undefined): string {
  if (!value) {
    return '';
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  const day = String(parsedDate.getUTCDate()).padStart(2, '0');
  const month = String(parsedDate.getUTCMonth() + 1).padStart(2, '0');
  const year = parsedDate.getUTCFullYear();

  return `${day}/${month}/${year}`;
}

function splitResidentCuit(value: string | undefined): {
  prefix: string;
  suffix: string;
} {
  const digits = value?.replace(/\D/g, '') ?? '';

  if (digits.length < 3) {
    return {
      prefix: '',
      suffix: '',
    };
  }

  return {
    prefix: digits.slice(0, 2),
    suffix: digits.slice(-1),
  };
}

function toResidentBooleanAnswer(
  value: boolean | undefined,
): ResidentBooleanAnswer {
  if (value === true) {
    return 'si';
  }

  if (value === false) {
    return 'no';
  }

  return '';
}

export function toResidentFormValues(
  resident: ResidentDetail,
): ResidentFormValues {
  const cuit = splitResidentCuit(resident.cuil);

  return {
    documentType: resident.documentType,
    documentNumber: resident.documentNumber,
    documentIssuingCountry: resident.documentIssuingCountry,
    procedureNumber: resident.procedureNumber ?? '',
    cuitPrefix: cuit.prefix,
    cuitSuffix: cuit.suffix,
    firstName: resident.firstName,
    middleNames: resident.middleNames ?? '',
    lastName: resident.lastName,
    otherLastNames: resident.otherLastNames ?? '',
    birthDate: formatResidentIsoDateForInput(resident.birthDate),
    admissionDate: formatResidentIsoDateForInput(resident.admissionDate),
    sex: resident.sex,
    maritalStatus: resident.maritalStatus ?? '',
    nationality: resident.nationality ?? '',
    email: resident.email ?? '',
    room: resident.room,
    careLevel: resident.careLevel,
    insurance: {
      provider: resident.insurance.provider ?? '',
      memberNumber: resident.insurance.memberNumber ?? '',
    },
    transfer: {
      provider: resident.transfer.provider ?? '',
      address: resident.transfer.address ?? '',
      phone: resident.transfer.phone ?? '',
    },
    psychiatry: {
      provider: resident.psychiatry.provider ?? '',
      careLocation: resident.psychiatry.careLocation ?? '',
      address: resident.psychiatry.address ?? '',
      phone: resident.psychiatry.phone ?? '',
    },
    clinicalProfile: {
      allergies: resident.clinicalProfile.allergies ?? '',
      emergencyCareLocation:
        resident.clinicalProfile.emergencyCareLocation ?? '',
      clinicalRecordNumber:
        resident.clinicalProfile.clinicalRecordNumber ?? '',
      primaryDoctorName: resident.clinicalProfile.primaryDoctorName ?? '',
      primaryDoctorOfficeAddress:
        resident.clinicalProfile.primaryDoctorOfficeAddress ?? '',
      primaryDoctorOfficePhone:
        resident.clinicalProfile.primaryDoctorOfficePhone ?? '',
      pathologies: resident.clinicalProfile.pathologies ?? '',
      surgeries: resident.clinicalProfile.surgeries ?? '',
      smokes: toResidentBooleanAnswer(resident.clinicalProfile.smokes),
      drinksAlcohol: toResidentBooleanAnswer(
        resident.clinicalProfile.drinksAlcohol,
      ),
      currentWeightKg:
        typeof resident.clinicalProfile.currentWeightKg === 'number'
          ? String(resident.clinicalProfile.currentWeightKg)
          : '',
    },
    belongings: {
      glasses: resident.belongings.glasses,
      dentures: resident.belongings.dentures,
      walker: resident.belongings.walker,
      orthopedicBed: resident.belongings.orthopedicBed,
      notes: resident.belongings.notes ?? '',
    },
    familyContacts: resident.familyContacts.map((contact) => ({
      localId: contact.id,
      fullName: contact.fullName,
      relationship: contact.relationship,
      phone: contact.phone,
      email: contact.email ?? '',
      address: contact.address ?? '',
      notes: contact.notes ?? '',
    })),
    discharge: {
      date: formatResidentIsoDateForInput(resident.discharge.date),
      reason: resident.discharge.reason ?? '',
    },
    medicalHistory: resident.medicalHistory.map((entry) => ({
      localId: entry.id,
      recordedAt: formatResidentIsoDateForInput(entry.recordedAt),
      title: entry.title,
      notes: entry.notes,
    })),
    attachments: resident.attachments.map((attachment) => ({
      localId: attachment.id,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
      dataUrl: attachment.dataUrl,
      kind: attachment.kind,
    })),
  };
}

function toResidentBaseInput(
  values: ResidentFormValues,
): ResidentUpdateInput {
  return {
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
    admissionDate: toResidentDateIso(values.admissionDate) ?? values.admissionDate,
    sex: values.sex as ResidentSex,
    maritalStatus: toOptionalString(values.maritalStatus),
    nationality: toOptionalString(values.nationality),
    email: values.email.trim() || undefined,
    room: values.room.trim(),
    careLevel: values.careLevel,
  };
}

export function toResidentCreateInput(
  values: ResidentFormValues,
): ResidentCreateInput {
  return {
    ...toResidentBaseInput(values),
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
      drinksAlcohol: toOptionalBoolean(values.clinicalProfile.drinksAlcohol),
      currentWeightKg: toOptionalNumber(values.clinicalProfile.currentWeightKg),
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
}

export function toResidentUpdateInput(
  values: ResidentFormValues,
): ResidentUpdateInput {
  return toResidentBaseInput(values);
}
