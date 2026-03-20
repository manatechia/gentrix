import type {
  ResidentCareLevel,
  ResidentDocumentType,
  ResidentSex,
} from '@gentrix/shared-types';

import {
  formatResidentCareLevel,
  formatResidentDocumentType,
  formatResidentSex,
} from '../../../shared/lib/display-labels';
import type { ResidentFormValues } from '../types/resident-form-values';

export const residentFormInitialValues: ResidentFormValues = {
  documentType: '',
  documentNumber: '',
  documentIssuingCountry: 'Argentina',
  firstName: '',
  middleNames: '',
  lastName: '',
  otherLastNames: '',
  birthDate: '',
  sex: '',
  email: '',
  room: '',
  careLevel: 'assisted',
  medicalHistory: [],
  attachments: [],
};

export const residentCareLevelOptions: Array<{
  value: ResidentCareLevel;
  label: string;
}> = [
  { value: 'independent', label: formatResidentCareLevel('independent') },
  { value: 'assisted', label: formatResidentCareLevel('assisted') },
  {
    value: 'high-dependency',
    label: formatResidentCareLevel('high-dependency'),
  },
  { value: 'memory-care', label: formatResidentCareLevel('memory-care') },
];

export const residentDocumentTypeOptions: Array<{
  value: ResidentDocumentType;
  label: string;
}> = [
  { value: 'dni', label: formatResidentDocumentType('dni') },
  { value: 'pasaporte', label: formatResidentDocumentType('pasaporte') },
  { value: 'cedula', label: formatResidentDocumentType('cedula') },
  {
    value: 'libreta-civica',
    label: formatResidentDocumentType('libreta-civica'),
  },
  { value: 'otro', label: formatResidentDocumentType('otro') },
];

export const residentSexOptions: Array<{
  value: ResidentSex;
  label: string;
}> = [
  { value: 'femenino', label: formatResidentSex('femenino') },
  { value: 'masculino', label: formatResidentSex('masculino') },
  { value: 'x', label: formatResidentSex('x') },
];

export const documentIssuingCountryOptions = [
  'Argentina',
  'Uruguay',
  'Chile',
  'Paraguay',
  'Bolivia',
  'Brasil',
  'Peru',
  'Otro',
] as const;
