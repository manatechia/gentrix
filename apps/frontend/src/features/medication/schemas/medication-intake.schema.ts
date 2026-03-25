import * as Yup from 'yup';

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const scheduleTimeSchema = Yup.object({
  localId: Yup.string().required(),
  value: Yup.string()
    .trim()
    .test(
      'valid-time',
      'Ingresa cada horario con formato HH:MM.',
      (value) => !value || timePattern.test(value),
    ),
});

export const medicationIntakeSchema = Yup.object({
  residentId: Yup.string()
    .trim()
    .required('Selecciona el residente para esta orden.'),
  medicationCatalogId: Yup.string()
    .trim()
    .required('Selecciona un medicamento del catalogo.'),
  dose: Yup.string().trim().required('La dosis es obligatoria.'),
  route: Yup.string().required('Selecciona la via de administracion.'),
  frequency: Yup.string().required('Selecciona la frecuencia.'),
  scheduleTimes: Yup.array()
    .of(scheduleTimeSchema)
    .max(4, 'Puedes cargar hasta 4 horarios por medicamento.')
    .test(
      'schedule-times-required',
      'Debes cargar al menos un horario para esta frecuencia.',
      (values, context) => {
        const frequency = context.parent.frequency;
        const filledCount =
          values?.filter((entry) => Boolean((entry.value ?? '').trim())).length ?? 0;

        if (frequency === 'as-needed') {
          return true;
        }

        return filledCount > 0;
      },
    )
    .test(
      'schedule-times-complete',
      'Completa o quita los horarios vacios.',
      (values) => {
        if (!values?.length) {
          return true;
        }

        const filledCount = values.filter((entry) => (entry.value ?? '').trim()).length;
        return filledCount === 0 || filledCount === values.length;
      },
    )
    .test(
      'schedule-times-unique',
      'Los horarios no pueden repetirse.',
      (values) => {
        const filledValues = (values ?? [])
          .map((entry) => (entry.value ?? '').trim())
          .filter(Boolean);

        return new Set(filledValues).size === filledValues.length;
      },
    )
    .required(),
  prescribedBy: Yup.string()
    .trim()
    .required('Debes indicar quien prescribio la orden.'),
  startDate: Yup.string()
    .required('La fecha de inicio es obligatoria.')
    .matches(datePattern, 'Selecciona una fecha valida.'),
  endDate: Yup.string()
    .trim()
    .test(
      'valid-end-date',
      'Selecciona una fecha valida.',
      (value) => !value || datePattern.test(value),
    )
    .test(
      'end-date-after-start-date',
      'La fecha de fin no puede ser anterior a la fecha de inicio.',
      (value, context) => {
        const startDate = context.parent.startDate;

        if (!value || !startDate || !datePattern.test(startDate)) {
          return true;
        }

        return value >= startDate;
      },
    ),
  status: Yup.string().required('Selecciona el estado de la orden.'),
});
