import type {
  ResidentCareLevel,
  ResidentDocumentType,
  ResidentGeriatricAssessmentLevel,
  ResidentSex,
} from '@gentrix/shared-types';

import {
  formatResidentCareLevel,
  formatResidentDocumentType,
  formatResidentGeriatricAssessmentLevel,
  formatResidentSex,
} from '../../../shared/lib/display-labels';
import { formatCurrentDateForResidentInput } from '../lib/resident-form-utils';
import type { ResidentFormValues } from '../types/resident-form-values';

export const residentFormInitialValues: ResidentFormValues = {
  documentType: '',
  documentNumber: '',
  documentIssuingCountry: 'Argentina',
  procedureNumber: '',
  cuitPrefix: '',
  cuitSuffix: '',
  firstName: '',
  middleNames: '',
  lastName: '',
  otherLastNames: '',
  birthDate: '',
  admissionDate: formatCurrentDateForResidentInput(),
  sex: '',
  maritalStatus: '',
  nationality: 'Argentina',
  email: '',
  room: '',
  careLevel: 'assisted',
  insurance: {
    provider: '',
    memberNumber: '',
  },
  transfer: {
    provider: '',
    address: '',
    phone: '',
  },
  psychiatry: {
    provider: '',
    careLocation: '',
    address: '',
    phone: '',
  },
  clinicalProfile: {
    allergies: '',
    emergencyCareLocation: '',
    clinicalRecordNumber: '',
    primaryDoctorName: '',
    primaryDoctorOfficeAddress: '',
    primaryDoctorOfficePhone: '',
    pathologies: '',
    surgeries: '',
    smokes: '',
    drinksAlcohol: '',
    currentWeightKg: '',
  },
  geriatricAssessment: {
    cognition: '',
    mobility: '',
    feeding: '',
    skinIntegrity: '',
    dependencyLevel: '',
    mood: '',
    supportEquipment: '',
    notes: '',
  },
  belongings: {
    glasses: false,
    dentures: false,
    walker: false,
    orthopedicBed: false,
    notes: '',
  },
  familyContacts: [],
  discharge: {
    date: '',
    reason: '',
  },
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

export const residentMaritalStatusOptions = [
  'Soltero/a',
  'Casado/a',
  'Viudo/a',
  'Divorciado/a',
  'Union convivencial',
  'Separado/a',
  'No informado',
] as const;

export const residentBooleanAnswerOptions = [
  { value: 'si', label: 'Si' },
  { value: 'no', label: 'No' },
] as const;

export const residentGeriatricAssessmentOptions: Array<{
  value: ResidentGeriatricAssessmentLevel;
  label: string;
}> = [
  {
    value: 'preserved',
    label: formatResidentGeriatricAssessmentLevel('preserved'),
  },
  {
    value: 'monitored',
    label: formatResidentGeriatricAssessmentLevel('monitored'),
  },
  {
    value: 'high-support',
    label: formatResidentGeriatricAssessmentLevel('high-support'),
  },
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
