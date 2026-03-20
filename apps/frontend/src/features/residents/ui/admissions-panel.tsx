import { FieldArray, Formik, getIn } from 'formik';
import type { ChangeEvent, FormEvent } from 'react';

import {
  documentIssuingCountryOptions,
  residentDocumentTypeOptions,
  residentCareLevelOptions,
  residentFormInitialValues,
  residentSexOptions,
} from '../constants/resident-intake';
import {
  createEmptyMedicalHistoryEntry,
  formatResidentDateInput,
  formatResidentAttachmentSize,
  getResidentAgeFromBirthDate,
  maxResidentAttachmentCount,
  toResidentAttachmentFormValue,
} from '../lib/resident-form-utils';
import { residentIntakeSchema } from '../schemas/resident-intake.schema';
import type {
  ResidentAttachmentFormValue,
  ResidentFormValues,
  ResidentMedicalHistoryFormValue,
} from '../types/resident-form-values';
import { formatResidentAttachmentKind } from '../../../shared/lib/display-labels';
import {
  badgeBaseClassName,
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  surfaceCardClassName,
} from '../../../shared/ui/class-names';

interface AdmissionsPanelProps {
  isSavingResident: boolean;
  residentCount: number;
  residentNoticeTone: 'success' | 'error';
  residentNotice: string | null;
  onSubmit: (values: ResidentFormValues) => Promise<unknown>;
}

const textareaClassName = `${inputClassName} min-h-[132px] py-3`;

function getEntryErrors(
  errors: unknown,
  index: number,
): Partial<Record<keyof ResidentMedicalHistoryFormValue, string>> {
  return (
    (getIn(errors, `medicalHistory.${index}`) as Partial<
      Record<keyof ResidentMedicalHistoryFormValue, string>
    >) ?? {}
  );
}

function getEntryTouched(
  touched: unknown,
  index: number,
): Partial<Record<keyof ResidentMedicalHistoryFormValue, boolean>> {
  return (
    (getIn(touched, `medicalHistory.${index}`) as Partial<
      Record<keyof ResidentMedicalHistoryFormValue, boolean>
    >) ?? {}
  );
}

function getAttachmentsError(errors: unknown): string | null {
  return typeof getIn(errors, 'attachments') === 'string'
    ? (getIn(errors, 'attachments') as string)
    : null;
}

export function AdmissionsPanel({
  isSavingResident,
  residentCount,
  residentNoticeTone,
  residentNotice,
  onSubmit,
}: AdmissionsPanelProps) {
  return (
    <article id="intake-panel" className={surfaceCardClassName}>
      <div className="mb-[18px] flex items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-primary">
            Alta
          </span>
          <h2 className="mt-1 text-[1.35rem] font-bold tracking-[-0.04em] text-brand-text">
            Agregar paciente
          </h2>
        </div>
        <span
          className={`${badgeBaseClassName} bg-brand-primary/12 text-brand-primary`}
        >
          {residentCount} residentes
        </span>
      </div>

      <p className="leading-[1.65] text-brand-text-secondary">
        Esta version amplia el alta con datos de identidad, fecha de
        nacimiento, antecedentes medicos y adjuntos clinicos. La edad se
        calcula automaticamente a partir de la fecha informada para que quien
        carga pueda corroborarla antes de guardar.
      </p>

      {residentNotice && (
        <div
          className={`mt-4 rounded-[18px] px-4 py-3.5 text-[0.95rem] leading-[1.55] ${
            residentNoticeTone === 'error'
              ? 'border border-[rgba(168,43,17,0.16)] bg-[rgba(168,43,17,0.08)] text-[rgb(130,44,25)]'
              : 'border border-[rgba(0,102,132,0.14)] bg-[rgba(0,102,132,0.08)] text-brand-secondary'
          }`}
        >
          {residentNotice}
        </div>
      )}

      <Formik<ResidentFormValues>
        initialValues={residentFormInitialValues}
        validationSchema={residentIntakeSchema}
        onSubmit={async (values, helpers) => {
          await onSubmit(values);
          helpers.resetForm();
        }}
      >
        {({
          errors,
          handleBlur,
          handleChange,
          setFieldError,
          setFieldTouched,
          setFieldValue,
          submitForm,
          touched,
          values,
        }) => {
          const computedAge = getResidentAgeFromBirthDate(values.birthDate);
          const attachmentsError = getAttachmentsError(errors);

          async function handleAttachmentChange(
            event: ChangeEvent<HTMLInputElement>,
          ): Promise<void> {
            const files = Array.from(event.currentTarget.files ?? []);

            event.currentTarget.value = '';

            if (!files.length) {
              return;
            }

            const nextCount = values.attachments.length + files.length;

            if (nextCount > maxResidentAttachmentCount) {
              setFieldTouched('attachments', true, false);
              setFieldError(
                'attachments',
                `Puedes cargar hasta ${maxResidentAttachmentCount} adjuntos entre imagenes y PDF.`,
              );
              return;
            }

            try {
              const nextAttachments = await Promise.all(
                files.map((file) => toResidentAttachmentFormValue(file)),
              );

              setFieldValue('attachments', [
                ...values.attachments,
                ...nextAttachments,
              ]);
              setFieldTouched('attachments', true, false);
              setFieldError('attachments', undefined);
            } catch (error) {
              setFieldTouched('attachments', true, false);
              setFieldError(
                'attachments',
                error instanceof Error
                  ? error.message
                  : 'No pude cargar los adjuntos seleccionados.',
              );
            }
          }

          return (
            <form
              className="mt-[18px] grid gap-[18px]"
              noValidate
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                event.stopPropagation();
                void submitForm();
              }}
            >
              <section className="grid gap-3">
                <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                  Identidad
                </span>
                <div className="grid gap-[14px] min-[980px]:grid-cols-3">
                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      Tipo de documento
                    </span>
                    <select
                      className={inputClassName}
                      name="documentType"
                      value={values.documentType}
                      onBlur={handleBlur}
                      onChange={handleChange}
                    >
                      <option value="">Seleccionar</option>
                      {residentDocumentTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {touched.documentType && errors.documentType && (
                      <span className="text-[0.85rem] text-[rgb(130,44,25)]">
                        {errors.documentType}
                      </span>
                    )}
                  </label>

                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      Numero de documento
                    </span>
                    <input
                      className={inputClassName}
                      type="text"
                      name="documentNumber"
                      value={values.documentNumber}
                      onBlur={handleBlur}
                      onChange={handleChange}
                    />
                    {touched.documentNumber && errors.documentNumber && (
                      <span className="text-[0.85rem] text-[rgb(130,44,25)]">
                        {errors.documentNumber}
                      </span>
                    )}
                  </label>

                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      Pais emisor del documento
                    </span>
                    <select
                      className={inputClassName}
                      name="documentIssuingCountry"
                      value={values.documentIssuingCountry}
                      onBlur={handleBlur}
                      onChange={handleChange}
                    >
                      {documentIssuingCountryOptions.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                    {touched.documentIssuingCountry &&
                      errors.documentIssuingCountry && (
                        <span className="text-[0.85rem] text-[rgb(130,44,25)]">
                          {errors.documentIssuingCountry}
                        </span>
                      )}
                  </label>
                </div>
              </section>

              <section className="grid gap-3">
                <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                  Datos personales
                </span>
                <div className="grid gap-[14px] min-[980px]:grid-cols-4">
                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      Nombre
                    </span>
                    <input
                      className={inputClassName}
                      type="text"
                      name="firstName"
                      value={values.firstName}
                      onBlur={handleBlur}
                      onChange={handleChange}
                    />
                    {touched.firstName && errors.firstName && (
                      <span className="text-[0.85rem] text-[rgb(130,44,25)]">
                        {errors.firstName}
                      </span>
                    )}
                  </label>

                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      Otros nombres (opcional)
                    </span>
                    <input
                      className={inputClassName}
                      type="text"
                      name="middleNames"
                      value={values.middleNames}
                      onBlur={handleBlur}
                      onChange={handleChange}
                    />
                  </label>

                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      Apellido
                    </span>
                    <input
                      className={inputClassName}
                      type="text"
                      name="lastName"
                      value={values.lastName}
                      onBlur={handleBlur}
                      onChange={handleChange}
                    />
                    {touched.lastName && errors.lastName && (
                      <span className="text-[0.85rem] text-[rgb(130,44,25)]">
                        {errors.lastName}
                      </span>
                    )}
                  </label>

                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      Otros apellidos (opcional)
                    </span>
                    <input
                      className={inputClassName}
                      type="text"
                      name="otherLastNames"
                      value={values.otherLastNames}
                      onBlur={handleBlur}
                      onChange={handleChange}
                    />
                  </label>
                </div>

                <div className="grid gap-[14px] min-[980px]:grid-cols-4">
                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      Fecha de nacimiento
                    </span>
                    <input
                      className={inputClassName}
                      type="text"
                      name="birthDate"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="DD/MM/YYYY"
                      value={values.birthDate}
                      onBlur={handleBlur}
                      onChange={(event) => {
                        void setFieldValue(
                          'birthDate',
                          formatResidentDateInput(event.target.value),
                        );
                      }}
                    />
                    {touched.birthDate && errors.birthDate && (
                      <span className="text-[0.85rem] text-[rgb(130,44,25)]">
                        {errors.birthDate}
                      </span>
                    )}
                  </label>

                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      Edad calculada
                    </span>
                    <input
                      className={`${inputClassName} cursor-default text-brand-text-secondary`}
                      type="text"
                      value={
                        computedAge === null
                          ? 'Se calcula automaticamente'
                          : `${computedAge} anos`
                      }
                      readOnly
                      tabIndex={-1}
                    />
                  </label>

                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      Sexo
                    </span>
                    <select
                      className={inputClassName}
                      name="sex"
                      value={values.sex}
                      onBlur={handleBlur}
                      onChange={handleChange}
                    >
                      <option value="">Seleccionar</option>
                      {residentSexOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {touched.sex && errors.sex && (
                      <span className="text-[0.85rem] text-[rgb(130,44,25)]">
                        {errors.sex}
                      </span>
                    )}
                  </label>

                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      Correo electronico (opcional)
                    </span>
                    <input
                      className={inputClassName}
                      type="email"
                      name="email"
                      value={values.email}
                      onBlur={handleBlur}
                      onChange={handleChange}
                    />
                    {touched.email && errors.email && (
                      <span className="text-[0.85rem] text-[rgb(130,44,25)]">
                        {errors.email}
                      </span>
                    )}
                  </label>
                </div>
              </section>

              <section className="grid gap-3">
                <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                  Datos residenciales
                </span>
                <div className="grid gap-[14px] min-[980px]:grid-cols-2">
                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      Habitacion
                    </span>
                    <input
                      className={inputClassName}
                      type="text"
                      name="room"
                      value={values.room}
                      onBlur={handleBlur}
                      onChange={handleChange}
                    />
                    {touched.room && errors.room && (
                      <span className="text-[0.85rem] text-[rgb(130,44,25)]">
                        {errors.room}
                      </span>
                    )}
                  </label>

                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      Nivel de cuidado
                    </span>
                    <select
                      className={inputClassName}
                      name="careLevel"
                      value={values.careLevel}
                      onBlur={handleBlur}
                      onChange={handleChange}
                    >
                      {residentCareLevelOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {touched.careLevel && errors.careLevel && (
                      <span className="text-[0.85rem] text-[rgb(130,44,25)]">
                        {errors.careLevel}
                      </span>
                    )}
                  </label>
                </div>
              </section>

              <FieldArray name="medicalHistory">
                {({ push, remove }) => (
                  <section className="grid gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                        Historial medico
                      </span>
                      <button
                        className={secondaryButtonClassName}
                        type="button"
                        onClick={() => push(createEmptyMedicalHistoryEntry())}
                      >
                        Agregar antecedente
                      </button>
                    </div>

                    {typeof getIn(errors, 'medicalHistory') === 'string' && (
                      <span className="text-[0.85rem] text-[rgb(130,44,25)]">
                        {getIn(errors, 'medicalHistory') as string}
                      </span>
                    )}

                    {values.medicalHistory.length === 0 ? (
                      <div className="rounded-[24px] border border-dashed border-[rgba(0,102,132,0.22)] bg-brand-neutral/60 px-5 py-5 text-brand-text-secondary">
                        Todavia no cargaste antecedentes. Puedes agregar
                        diagnosticos previos, cirugias, alergias, eventos
                        relevantes o cualquier historial medico de ingreso.
                      </div>
                    ) : (
                      <div className="grid gap-[14px]">
                        {values.medicalHistory.map((entry, index) => {
                          const entryErrors = getEntryErrors(errors, index);
                          const entryTouched = getEntryTouched(touched, index);

                          return (
                            <article
                              key={entry.localId}
                              className="rounded-[24px] border border-[rgba(0,102,132,0.08)] bg-brand-neutral/60 p-5"
                            >
                              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                                  Antecedente {index + 1}
                                </span>
                                <button
                                  className={secondaryButtonClassName}
                                  type="button"
                                  onClick={() => remove(index)}
                                >
                                  Quitar
                                </button>
                              </div>

                              <div className="grid gap-[14px] min-[980px]:grid-cols-[220px_minmax(0,1fr)]">
                                <label className="grid gap-2.5">
                                  <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                                    Fecha del antecedente
                                  </span>
                                  <input
                                    className={inputClassName}
                                    type="text"
                                    name={`medicalHistory.${index}.recordedAt`}
                                    inputMode="numeric"
                                    maxLength={10}
                                    placeholder="DD/MM/YYYY"
                                    value={entry.recordedAt}
                                    onBlur={handleBlur}
                                    onChange={(event) => {
                                      void setFieldValue(
                                        `medicalHistory.${index}.recordedAt`,
                                        formatResidentDateInput(
                                          event.target.value,
                                        ),
                                      );
                                    }}
                                  />
                                  {entryTouched.recordedAt &&
                                    entryErrors.recordedAt && (
                                      <span className="text-[0.85rem] text-[rgb(130,44,25)]">
                                        {entryErrors.recordedAt}
                                      </span>
                                    )}
                                </label>

                                <label className="grid gap-2.5">
                                  <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                                    Titulo
                                  </span>
                                  <input
                                    className={inputClassName}
                                    type="text"
                                    name={`medicalHistory.${index}.title`}
                                    value={entry.title}
                                    onBlur={handleBlur}
                                    onChange={handleChange}
                                  />
                                  {entryTouched.title && entryErrors.title && (
                                    <span className="text-[0.85rem] text-[rgb(130,44,25)]">
                                      {entryErrors.title}
                                    </span>
                                  )}
                                </label>
                              </div>

                              <label className="mt-[14px] grid gap-2.5">
                                <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                                  Detalle
                                </span>
                                <textarea
                                  className={textareaClassName}
                                  name={`medicalHistory.${index}.notes`}
                                  value={entry.notes}
                                  onBlur={handleBlur}
                                  onChange={handleChange}
                                />
                                {entryTouched.notes && entryErrors.notes && (
                                  <span className="text-[0.85rem] text-[rgb(130,44,25)]">
                                    {entryErrors.notes}
                                  </span>
                                )}
                              </label>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </section>
                )}
              </FieldArray>

              <section className="grid gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                    Adjuntos clinicos
                  </span>
                  <span className="text-[0.9rem] text-brand-text-secondary">
                    Hasta {maxResidentAttachmentCount} archivos, imagen o PDF
                  </span>
                </div>

                <label className="grid gap-2.5">
                  <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                    Imagenes o PDF
                  </span>
                  <input
                    className={`${inputClassName} py-3`}
                    type="file"
                    accept="image/*,application/pdf,.pdf"
                    multiple
                    onChange={(event) => {
                      void handleAttachmentChange(event);
                    }}
                  />
                  <span className="text-[0.9rem] leading-[1.5] text-brand-text-secondary">
                    Usa esta seccion para subir estudios, fotos, ordenes,
                    informes o PDFs relevantes para el ingreso. Cada archivo
                    puede pesar hasta 5 MB.
                  </span>
                  {attachmentsError && (
                    <span className="text-[0.85rem] text-[rgb(130,44,25)]">
                      {attachmentsError}
                    </span>
                  )}
                </label>

                {values.attachments.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-[rgba(0,102,132,0.22)] bg-brand-neutral/60 px-5 py-5 text-brand-text-secondary">
                    No hay adjuntos cargados todavia.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {values.attachments.map(
                      (attachment: ResidentAttachmentFormValue) => (
                        <article
                          key={attachment.localId}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-[rgba(0,102,132,0.08)] bg-brand-neutral/60 px-5 py-4"
                        >
                          <div className="grid gap-1">
                            <strong className="text-brand-text">
                              {attachment.fileName}
                            </strong>
                            <span className="text-brand-text-secondary">
                              {formatResidentAttachmentKind(attachment.kind)} ·{' '}
                              {formatResidentAttachmentSize(
                                attachment.sizeBytes,
                              )}
                            </span>
                          </div>
                          <button
                            className={secondaryButtonClassName}
                            type="button"
                            onClick={() => {
                              void setFieldValue(
                                'attachments',
                                values.attachments.filter(
                                  (candidate) =>
                                    candidate.localId !== attachment.localId,
                                ),
                              );
                            }}
                          >
                            Quitar archivo
                          </button>
                        </article>
                      ),
                    )}
                  </div>
                )}
              </section>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  className={primaryButtonClassName}
                  type="button"
                  disabled={isSavingResident}
                  onClick={() => {
                    void submitForm();
                  }}
                >
                  {isSavingResident ? 'Guardando...' : 'Guardar paciente'}
                </button>
              </div>
            </form>
          );
        }}
      </Formik>
    </article>
  );
}
