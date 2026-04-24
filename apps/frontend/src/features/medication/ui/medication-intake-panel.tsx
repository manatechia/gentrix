import { FieldArray, Formik, getIn } from 'formik';
import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import {
  createMedicationFormInitialValues,
  createMedicationScheduleTime,
  medicationFrequencyOptions,
  medicationRouteOptions,
  medicationStatusOptions,
} from '../constants/medication-intake';
import { medicationIntakeSchema } from '../schemas/medication-intake.schema';
import type { MedicationFormValues } from '../types/medication-form-values';
import {
  badgeBaseClassName,
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  surfaceCardClassName,
} from '../../../shared/ui/class-names';
import {
  type SelectFieldOption,
  SelectField,
} from '../../../shared/ui/select-field';

interface MedicationIntakePanelProps {
  mode?: 'create' | 'edit';
  initialValues?: MedicationFormValues;
  residentOptions: ReadonlyArray<SelectFieldOption>;
  medicationCatalogOptions: ReadonlyArray<SelectFieldOption>;
  isSavingMedication: boolean;
  medicationNoticeTone: 'success' | 'error';
  medicationNotice: string | null;
  panelEyebrow?: string;
  panelTitle?: string;
  panelDescription?: string;
  submitLabel?: string;
  panelBadgeText?: string;
  secondaryAction?: {
    href: string;
    label: string;
  };
  onSubmit: (values: MedicationFormValues) => Promise<unknown>;
}

function ValidationMessage({ message }: { message?: string | null }) {
  const hasMessage = typeof message === 'string' && message.trim().length > 0;

  return (
    <span
      aria-live="polite"
      className={`min-h-[2.35rem] text-[0.85rem] leading-[1.35] transition-opacity ${
        hasMessage
          ? 'text-[rgb(130,44,25)] opacity-100'
          : 'pointer-events-none select-none opacity-0'
      }`}
    >
      {hasMessage ? message : '\u00A0'}
    </span>
  );
}

function getFieldMessage(
  errors: unknown,
  touched: unknown,
  path: string,
): string | undefined {
  return getIn(touched, path) ? (getIn(errors, path) as string) : undefined;
}

function getScheduleTimeError(
  errors: unknown,
  touched: unknown,
  index: number,
): string | undefined {
  return getFieldMessage(errors, touched, `scheduleTimes.${index}.value`);
}

function getArrayError(errors: unknown, path: string): string | undefined {
  return typeof getIn(errors, path) === 'string'
    ? (getIn(errors, path) as string)
    : undefined;
}

const innerPanelClassName =
  'rounded-[24px] border border-[rgba(0,102,132,0.08)] bg-brand-neutral/60 p-5';

export function MedicationIntakePanel({
  mode = 'create',
  initialValues,
  residentOptions,
  medicationCatalogOptions,
  isSavingMedication,
  medicationNoticeTone,
  medicationNotice,
  panelEyebrow,
  panelTitle,
  panelDescription,
  submitLabel,
  panelBadgeText,
  secondaryAction,
  onSubmit,
}: MedicationIntakePanelProps) {
  const [createInitialValues] = useState<MedicationFormValues>(() =>
    createMedicationFormInitialValues(),
  );
  const isEditMode = mode === 'edit';
  const formInitialValues = useMemo(
    () => initialValues ?? createInitialValues,
    [createInitialValues, initialValues],
  );
  const resolvedPanelEyebrow =
    panelEyebrow ?? (isEditMode ? 'Edición' : 'Nueva orden');
  const resolvedPanelTitle =
    panelTitle ?? (isEditMode ? 'Editar medicación' : 'Cargar medicación');
  const resolvedPanelDescription =
    panelDescription ??
    'Registre la prescripción vigente del residente con dosis, vía, horarios previstos, profesional tratante y vigencia de la orden.';
  const resolvedSubmitLabel =
    submitLabel ?? (isEditMode ? 'Guardar cambios' : 'Guardar orden');
  const routeFrequencyGridClassName = isEditMode
    ? 'mt-[14px] grid gap-[14px] min-[980px]:grid-cols-3'
    : 'mt-[14px] grid gap-[14px] min-[980px]:grid-cols-2';

  return (
    <article className={surfaceCardClassName}>
      <div className="mb-[18px] flex items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-primary">
            {resolvedPanelEyebrow}
          </span>
          <h2 className="mt-1 text-[1.35rem] font-bold tracking-[-0.04em] text-brand-text">
            {resolvedPanelTitle}
          </h2>
        </div>

        {panelBadgeText ? (
          <span
            className={`${badgeBaseClassName} bg-brand-primary/12 text-brand-primary`}
          >
            {panelBadgeText}
          </span>
        ) : null}
      </div>

      <p className="leading-[1.65] text-brand-text-secondary">
        {resolvedPanelDescription}
      </p>

      <div className="mt-4 rounded-[18px] border border-[rgba(0,102,132,0.14)] bg-[rgba(0,102,132,0.08)] px-4 py-3.5 text-[0.95rem] leading-[1.55] text-brand-secondary">
        Esta pantalla define la orden vigente. La administración, omisión o
        rechazo de cada toma se registrará en un flujo separado de ejecución.
      </div>

      {medicationNotice && (
        <div
          data-testid="medication-form-notice"
          className={`mt-4 rounded-[18px] px-4 py-3.5 text-[0.95rem] leading-[1.55] ${
            medicationNoticeTone === 'error'
              ? 'border border-[rgba(168,43,17,0.16)] bg-[rgba(168,43,17,0.08)] text-[rgb(130,44,25)]'
              : 'border border-[rgba(0,102,132,0.14)] bg-[rgba(0,102,132,0.08)] text-brand-secondary'
          }`}
        >
          {medicationNotice}
        </div>
      )}

      <Formik<MedicationFormValues>
        enableReinitialize
        initialValues={formInitialValues}
        validationSchema={medicationIntakeSchema}
        onSubmit={async (values, helpers) => {
          await onSubmit(values);

          if (!isEditMode) {
            helpers.resetForm({
              values: createMedicationFormInitialValues(),
            });
          }
        }}
      >
        {({
          errors,
          handleBlur,
          handleChange,
          setFieldTouched,
          setFieldValue,
          submitForm,
          touched,
          values,
        }) => {
          const scheduleTimesError = getArrayError(errors, 'scheduleTimes');

          return (
            <form
              data-testid={
                isEditMode ? 'medication-edit-form' : 'medication-create-form'
              }
              className="mt-[18px] grid gap-[18px]"
              noValidate
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                event.stopPropagation();
                void submitForm();
              }}
            >
              <section className={innerPanelClassName}>
                <div className="grid gap-[14px] min-[980px]:grid-cols-3">
                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      Residente
                    </span>
                    <SelectField
                      name="residentId"
                      testId="medication-resident-select"
                      value={values.residentId}
                      options={residentOptions}
                      placeholder="Seleccionar residente"
                      allowEmptyOption
                      onBlur={() => {
                        void setFieldTouched('residentId', true);
                      }}
                      onChange={(nextValue) => {
                        void setFieldValue('residentId', nextValue);
                      }}
                    />
                    <ValidationMessage
                      message={getFieldMessage(errors, touched, 'residentId')}
                    />
                  </label>

                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      Medicamento
                    </span>
                    <SelectField
                      name="medicationCatalogId"
                      testId="medication-catalog-select"
                      value={values.medicationCatalogId}
                      options={medicationCatalogOptions}
                      placeholder="Seleccionar medicamento"
                      allowEmptyOption
                      onBlur={() => {
                        void setFieldTouched('medicationCatalogId', true);
                      }}
                      onChange={(nextValue) => {
                        void setFieldValue('medicationCatalogId', nextValue);
                      }}
                    />
                    <ValidationMessage
                      message={getFieldMessage(
                        errors,
                        touched,
                        'medicationCatalogId',
                      )}
                    />
                  </label>

                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      Dosis
                    </span>
                    <input
                      data-testid="medication-dose-input"
                      className={inputClassName}
                      type="text"
                      name="dose"
                      value={values.dose}
                      onBlur={handleBlur}
                      onChange={handleChange}
                    />
                    <ValidationMessage
                      message={getFieldMessage(errors, touched, 'dose')}
                    />
                  </label>
                </div>

                <div className={routeFrequencyGridClassName}>
                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      Vía
                    </span>
                    <SelectField
                      name="route"
                      testId="medication-route-select"
                      value={values.route}
                      options={medicationRouteOptions}
                      onBlur={() => {
                        void setFieldTouched('route', true);
                      }}
                      onChange={(nextValue) => {
                        void setFieldValue('route', nextValue);
                      }}
                    />
                    <ValidationMessage
                      message={getFieldMessage(errors, touched, 'route')}
                    />
                  </label>

                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      Frecuencia
                    </span>
                    <SelectField
                      name="frequency"
                      testId="medication-frequency-select"
                      value={values.frequency}
                      options={medicationFrequencyOptions}
                      onBlur={() => {
                        void setFieldTouched('frequency', true);
                      }}
                      onChange={(nextValue) => {
                        void setFieldValue('frequency', nextValue);
                      }}
                    />
                    <ValidationMessage
                      message={getFieldMessage(errors, touched, 'frequency')}
                    />
                  </label>

                  {isEditMode && (
                    <label className="grid gap-2.5">
                      <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                        Estado
                      </span>
                      <SelectField
                        name="status"
                        testId="medication-status-select"
                        value={values.status}
                        options={medicationStatusOptions}
                        onBlur={() => {
                          void setFieldTouched('status', true);
                        }}
                        onChange={(nextValue) => {
                          void setFieldValue('status', nextValue);
                        }}
                      />
                      <ValidationMessage
                        message={getFieldMessage(errors, touched, 'status')}
                      />
                    </label>
                  )}
                </div>

                <div className="mt-[14px] grid gap-[14px] min-[980px]:grid-cols-3">
                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      Prescripto por
                    </span>
                    <input
                      data-testid="medication-prescribed-by-input"
                      className={inputClassName}
                      type="text"
                      name="prescribedBy"
                      value={values.prescribedBy}
                      onBlur={handleBlur}
                      onChange={handleChange}
                    />
                    <ValidationMessage
                      message={getFieldMessage(
                        errors,
                        touched,
                        'prescribedBy',
                      )}
                    />
                  </label>

                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      Inicio
                    </span>
                    <input
                      data-testid="medication-start-date-input"
                      className={inputClassName}
                      type="date"
                      name="startDate"
                      value={values.startDate}
                      onBlur={handleBlur}
                      onChange={handleChange}
                    />
                    <ValidationMessage
                      message={getFieldMessage(errors, touched, 'startDate')}
                    />
                  </label>

                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      Fin
                    </span>
                    <input
                      data-testid="medication-end-date-input"
                      className={inputClassName}
                      type="date"
                      name="endDate"
                      value={values.endDate}
                      onBlur={handleBlur}
                      onChange={handleChange}
                    />
                    <ValidationMessage
                      message={getFieldMessage(errors, touched, 'endDate')}
                    />
                  </label>
                </div>
              </section>

              <FieldArray name="scheduleTimes">
                {({ push, remove }) => (
                  <section className={innerPanelClassName}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="grid gap-1">
                        <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                          Horarios
                        </span>
                        <span className="leading-[1.55] text-brand-text-secondary">
                          Si la frecuencia es según necesidad, puede dejar la
                          prescripción sin horarios fijos. La ejecución concreta
                          de cada toma se registrará aparte.
                        </span>
                      </div>

                      <button
                        data-testid="medication-add-schedule-button"
                        className={secondaryButtonClassName}
                        type="button"
                        disabled={values.scheduleTimes.length >= 4}
                        onClick={() => {
                          push(createMedicationScheduleTime());
                        }}
                      >
                        Agregar horario
                      </button>
                    </div>

                    <ValidationMessage message={scheduleTimesError} />

                    {values.scheduleTimes.length === 0 ? (
                      <div className="rounded-[22px] border border-dashed border-[rgba(0,102,132,0.22)] bg-white/70 px-4 py-4 text-brand-text-secondary">
                        No hay horarios cargados para esta orden.
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {values.scheduleTimes.map((entry, index) => (
                          <article
                            key={entry.localId}
                            data-testid={`medication-schedule-${index}`}
                            className="rounded-[22px] border border-[rgba(0,102,132,0.08)] bg-white/80 px-4 py-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                                Horario {index + 1}
                              </span>

                              <button
                                data-testid={`medication-schedule-remove-${index}`}
                                className={secondaryButtonClassName}
                                type="button"
                                onClick={() => remove(index)}
                              >
                                Quitar
                              </button>
                            </div>

                            <label className="mt-3 grid gap-2.5">
                              <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                                Hora
                              </span>
                              <input
                                data-testid={`medication-schedule-time-${index}`}
                                className={inputClassName}
                                type="time"
                                name={`scheduleTimes.${index}.value`}
                                value={entry.value}
                                onBlur={handleBlur}
                                onChange={handleChange}
                              />
                              <ValidationMessage
                                message={getScheduleTimeError(
                                  errors,
                                  touched,
                                  index,
                                )}
                              />
                            </label>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </FieldArray>

              <div className="flex flex-wrap items-center gap-3">
                {secondaryAction ? (
                  <Link className={secondaryButtonClassName} to={secondaryAction.href}>
                    {secondaryAction.label}
                  </Link>
                ) : null}

                <button
                  data-testid="medication-submit-button"
                  className={primaryButtonClassName}
                  type="button"
                  disabled={isSavingMedication}
                  onClick={() => {
                    void submitForm();
                  }}
                >
                  {isSavingMedication ? 'Guardando...' : resolvedSubmitLabel}
                </button>
              </div>
            </form>
          );
        }}
      </Formik>
    </article>
  );
}
