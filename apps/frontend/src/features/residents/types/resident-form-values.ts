import type {
  ResidentAttachmentKind,
  ResidentCareLevel,
} from '@gentrix/shared-types';

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

export interface ResidentFormValues {
  documentType: string;
  documentNumber: string;
  documentIssuingCountry: string;
  firstName: string;
  middleNames: string;
  lastName: string;
  otherLastNames: string;
  birthDate: string;
  sex: string;
  email: string;
  room: string;
  careLevel: ResidentCareLevel;
  medicalHistory: ResidentMedicalHistoryFormValue[];
  attachments: ResidentAttachmentFormValue[];
}
