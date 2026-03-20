import * as Yup from 'yup';

import {
  isResidentDateInFuture,
  toResidentDateIso,
} from '../lib/resident-form-utils';

const medicalHistoryEntrySchema = Yup.object({
  localId: Yup.string().required(),
  recordedAt: Yup.string()
    .required('La fecha del antecedente es obligatoria.')
    .test(
      'valid-history-date',
      'Ingresa la fecha con formato DD/MM/YYYY.',
      (value) => !value || toResidentDateIso(value) !== null,
    )
    .test(
      'history-not-future',
      'La fecha del antecedente no puede estar en el futuro.',
      (value) => !value || !isResidentDateInFuture(value),
    ),
  title: Yup.string()
    .trim()
    .required('El titulo del antecedente es obligatorio.'),
  notes: Yup.string()
    .trim()
    .required('El detalle del antecedente es obligatorio.'),
});

const attachmentSchema = Yup.object({
  localId: Yup.string().required(),
  fileName: Yup.string().required(),
  mimeType: Yup.string().required(),
  sizeBytes: Yup.number().min(1).max(5_000_000),
  dataUrl: Yup.string().required(),
  kind: Yup.string().oneOf(['image', 'pdf']).required(),
});

const familyContactSchema = Yup.object({
  localId: Yup.string().required(),
  fullName: Yup.string()
    .trim()
    .required('El nombre del familiar es obligatorio.'),
  relationship: Yup.string()
    .trim()
    .required('La relacion con el paciente es obligatoria.'),
  phone: Yup.string().trim().required('El telefono del familiar es obligatorio.'),
  email: Yup.string()
    .trim()
    .email('Ingresa un correo electronico valido.')
    .optional(),
  address: Yup.string().trim(),
  notes: Yup.string().trim(),
});

const insuranceSchema = Yup.object({
  provider: Yup.string().trim(),
  memberNumber: Yup.string().trim(),
});

const transferSchema = Yup.object({
  provider: Yup.string().trim(),
  address: Yup.string().trim(),
  phone: Yup.string().trim(),
});

const psychiatrySchema = Yup.object({
  provider: Yup.string().trim(),
  careLocation: Yup.string().trim(),
  address: Yup.string().trim(),
  phone: Yup.string().trim(),
});

const clinicalProfileSchema = Yup.object({
  allergies: Yup.string().trim(),
  emergencyCareLocation: Yup.string().trim(),
  clinicalRecordNumber: Yup.string().trim(),
  primaryDoctorName: Yup.string().trim(),
  primaryDoctorOfficeAddress: Yup.string().trim(),
  primaryDoctorOfficePhone: Yup.string().trim(),
  pathologies: Yup.string().trim(),
  surgeries: Yup.string().trim(),
  smokes: Yup.string().oneOf(['', 'si', 'no']),
  drinksAlcohol: Yup.string().oneOf(['', 'si', 'no']),
  currentWeightKg: Yup.string()
    .trim()
    .test(
      'weight-is-numeric',
      'Ingresa el peso como numero, por ejemplo 62.5.',
      (value) => {
        if (!value?.trim()) {
          return true;
        }

        return /^(\d+)([.,]\d+)?$/.test(value.trim());
      },
    )
    .test(
      'weight-in-range',
      'El peso debe estar entre 0 y 500 kg.',
      (value) => {
        if (!value?.trim()) {
          return true;
        }

        const parsedValue = Number.parseFloat(value.replace(',', '.'));
        return Number.isFinite(parsedValue) && parsedValue >= 0 && parsedValue <= 500;
      },
    ),
});

const belongingsSchema = Yup.object({
  glasses: Yup.boolean().required(),
  dentures: Yup.boolean().required(),
  walker: Yup.boolean().required(),
  orthopedicBed: Yup.boolean().required(),
  notes: Yup.string().trim(),
});

const dischargeSchema = Yup.object({
  date: Yup.string()
    .trim()
    .test(
      'valid-discharge-date',
      'Ingresa la fecha con formato DD/MM/YYYY.',
      (value) => !value || toResidentDateIso(value) !== null,
    )
    .test(
      'discharge-not-future',
      'La fecha de salida no puede estar en el futuro.',
      (value) => !value || !isResidentDateInFuture(value),
    ),
  reason: Yup.string().trim(),
});

export const residentIntakeSchema = Yup.object({
  documentType: Yup.string().required('El tipo de documento es obligatorio.'),
  documentNumber: Yup.string()
    .trim()
    .required('El numero de documento es obligatorio.'),
  documentIssuingCountry: Yup.string()
    .trim()
    .required('El pais emisor del documento es obligatorio.'),
  procedureNumber: Yup.string().trim(),
  cuitPrefix: Yup.string()
    .trim()
    .matches(/^\d{0,2}$/, 'El prefijo del CUIT debe tener 2 digitos.'),
  cuitSuffix: Yup.string()
    .trim()
    .matches(/^\d{0,1}$/, 'El digito final del CUIT debe tener 1 digito.'),
  firstName: Yup.string().trim().required('El nombre es obligatorio.'),
  middleNames: Yup.string().trim(),
  lastName: Yup.string().trim().required('El apellido es obligatorio.'),
  otherLastNames: Yup.string().trim(),
  birthDate: Yup.string()
    .required('La fecha de nacimiento es obligatoria.')
    .test(
      'valid-birth-date',
      'Ingresa la fecha con formato DD/MM/YYYY.',
      (value) => !value || toResidentDateIso(value) !== null,
    )
    .test(
      'birth-date-not-future',
      'La fecha de nacimiento no puede estar en el futuro.',
      (value) => !value || !isResidentDateInFuture(value),
    ),
  admissionDate: Yup.string()
    .required('La fecha de ingreso es obligatoria.')
    .test(
      'valid-admission-date',
      'Ingresa la fecha con formato DD/MM/YYYY.',
      (value) => !value || toResidentDateIso(value) !== null,
    )
    .test(
      'admission-date-not-future',
      'La fecha de ingreso no puede estar en el futuro.',
      (value) => !value || !isResidentDateInFuture(value),
    ),
  sex: Yup.string().required('El sexo es obligatorio.'),
  maritalStatus: Yup.string().trim(),
  nationality: Yup.string().trim(),
  email: Yup.string()
    .trim()
    .email('Ingresa un correo electronico valido.')
    .optional(),
  room: Yup.string().trim().required('La habitacion es obligatoria.'),
  careLevel: Yup.string().required('El nivel de cuidado es obligatorio.'),
  insurance: insuranceSchema.required(),
  transfer: transferSchema.required(),
  psychiatry: psychiatrySchema.required(),
  clinicalProfile: clinicalProfileSchema.required(),
  belongings: belongingsSchema.required(),
  familyContacts: Yup.array()
    .of(familyContactSchema)
    .max(6, 'Puedes cargar hasta 6 familiares o contactos.'),
  discharge: dischargeSchema.required(),
  medicalHistory: Yup.array()
    .of(medicalHistoryEntrySchema)
    .max(10, 'Puedes cargar hasta 10 antecedentes medicos.'),
  attachments: Yup.array()
    .of(attachmentSchema)
    .max(6, 'Puedes cargar hasta 6 adjuntos.'),
}).test(
  'cuit-complete',
  'Completa el CUIT con 2 digitos iniciales y 1 digito final.',
  (values, context) => {
    const prefix = values?.cuitPrefix?.trim() ?? '';
    const suffix = values?.cuitSuffix?.trim() ?? '';

    if (!prefix && !suffix) {
      return true;
    }

    if (prefix.length !== 2) {
      return context.createError({
        path: 'cuitPrefix',
        message: 'Ingresa los 2 primeros digitos del CUIT.',
      });
    }

    if (suffix.length !== 1) {
      return context.createError({
        path: 'cuitSuffix',
        message: 'Ingresa el ultimo digito del CUIT.',
      });
    }

    return true;
  },
).test(
  'discharge-after-admission',
  'La fecha de salida no puede ser anterior a la fecha de ingreso.',
  (values) => {
    if (!values?.admissionDate || !values?.discharge?.date) {
      return true;
    }

    const admissionDateIso = toResidentDateIso(values.admissionDate);
    const dischargeDateIso = toResidentDateIso(values.discharge.date);

    if (!admissionDateIso || !dischargeDateIso) {
      return true;
    }

    return dischargeDateIso.slice(0, 10) >= admissionDateIso.slice(0, 10);
  },
);
