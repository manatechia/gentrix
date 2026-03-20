import * as Yup from 'yup';

import {
  isResidentDateInFuture,
  toResidentBirthDateIso,
} from '../lib/resident-form-utils';

const medicalHistoryEntrySchema = Yup.object({
  localId: Yup.string().required(),
  recordedAt: Yup.string()
    .required('La fecha del antecedente es obligatoria.')
    .test(
      'valid-history-date',
      'Ingresa la fecha con formato DD/MM/YYYY.',
      (value) => !value || toResidentBirthDateIso(value) !== null,
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

export const residentIntakeSchema = Yup.object({
  documentType: Yup.string().required('El tipo de documento es obligatorio.'),
  documentNumber: Yup.string()
    .trim()
    .required('El numero de documento es obligatorio.'),
  documentIssuingCountry: Yup.string()
    .trim()
    .required('El pais emisor del documento es obligatorio.'),
  firstName: Yup.string().trim().required('El nombre es obligatorio.'),
  middleNames: Yup.string().trim(),
  lastName: Yup.string().trim().required('El apellido es obligatorio.'),
  otherLastNames: Yup.string().trim(),
  birthDate: Yup.string()
    .required('La fecha de nacimiento es obligatoria.')
    .test(
      'valid-birth-date',
      'Ingresa la fecha con formato DD/MM/YYYY.',
      (value) => !value || toResidentBirthDateIso(value) !== null,
    )
    .test(
      'birth-date-not-future',
      'La fecha de nacimiento no puede estar en el futuro.',
      (value) => !value || !isResidentDateInFuture(value),
    ),
  sex: Yup.string().required('El sexo es obligatorio.'),
  email: Yup.string()
    .trim()
    .email('Ingresa un correo electronico valido.')
    .optional(),
  room: Yup.string().trim().required('La habitacion es obligatoria.'),
  careLevel: Yup.string().required('El nivel de cuidado es obligatorio.'),
  medicalHistory: Yup.array()
    .of(medicalHistoryEntrySchema)
    .max(10, 'Puedes cargar hasta 10 antecedentes medicos.'),
  attachments: Yup.array()
    .of(attachmentSchema)
    .max(6, 'Puedes cargar hasta 6 adjuntos.'),
});
