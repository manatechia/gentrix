import type {
  ResidentAttachmentKind,
  ResidentCareLevel,
} from '@gentrix/shared-types';

export type ResidentBooleanAnswer = '' | 'si' | 'no';

export interface ResidentMedicalHistoryFormValue {
  localId: string;
  recordedAt: string;
  title: string;
  notes: string;
}

export interface ResidentAttachmentFormValue {
  localId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl: string;
  kind: ResidentAttachmentKind;
}

export interface ResidentInsuranceFormValues {
  provider: string;
  memberNumber: string;
}

export interface ResidentTransferFormValues {
  provider: string;
  address: string;
  phone: string;
}

export interface ResidentPsychiatryFormValues {
  provider: string;
  careLocation: string;
  address: string;
  phone: string;
}

export interface ResidentClinicalProfileFormValues {
  allergies: string;
  emergencyCareLocation: string;
  clinicalRecordNumber: string;
  primaryDoctorName: string;
  primaryDoctorOfficeAddress: string;
  primaryDoctorOfficePhone: string;
  pathologies: string;
  surgeries: string;
  smokes: ResidentBooleanAnswer;
  drinksAlcohol: ResidentBooleanAnswer;
  currentWeightKg: string;
}

export interface ResidentBelongingsFormValues {
  glasses: boolean;
  dentures: boolean;
  walker: boolean;
  orthopedicBed: boolean;
  notes: string;
}

export interface ResidentFamilyContactFormValue {
  localId: string;
  fullName: string;
  relationship: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

export interface ResidentDischargeFormValues {
  date: string;
  reason: string;
}

export interface ResidentFormValues {
  documentType: string;
  documentNumber: string;
  documentIssuingCountry: string;
  procedureNumber: string;
  cuitPrefix: string;
  cuitSuffix: string;
  firstName: string;
  middleNames: string;
  lastName: string;
  otherLastNames: string;
  birthDate: string;
  admissionDate: string;
  sex: string;
  maritalStatus: string;
  nationality: string;
  email: string;
  room: string;
  careLevel: ResidentCareLevel;
  insurance: ResidentInsuranceFormValues;
  transfer: ResidentTransferFormValues;
  psychiatry: ResidentPsychiatryFormValues;
  clinicalProfile: ResidentClinicalProfileFormValues;
  belongings: ResidentBelongingsFormValues;
  familyContacts: ResidentFamilyContactFormValue[];
  discharge: ResidentDischargeFormValues;
  medicalHistory: ResidentMedicalHistoryFormValue[];
  attachments: ResidentAttachmentFormValue[];
}
