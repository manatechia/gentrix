import { FieldArray, Formik, getIn } from 'formik';
import {
  useMemo,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from 'react';
import { Link } from 'react-router-dom';

import {
  documentIssuingCountryOptions,
  residentBooleanAnswerOptions,
  residentCareLevelOptions,
  residentDocumentTypeOptions,
  residentFormInitialValues,
  residentMaritalStatusOptions,
  residentSexOptions,
} from '../constants/resident-intake';
import {
  createEmptyFamilyContact,
  createEmptyMedicalHistoryEntry,
  formatResidentDigitsInput,
  formatCurrentDateForResidentInput,
  formatResidentAttachmentSize,
  formatResidentDateInput,
  getResidentDocumentDigits,
  getResidentAgeFromBirthDate,
  maxResidentAttachmentCount,
  toResidentAttachmentFormValue,
} from '../lib/resident-form-utils';
import {
  residentBaseUpdateSchema,
  residentIntakeSchema,
} from '../schemas/resident-intake.schema';
import type {
  ResidentAttachmentFormValue,
  ResidentFamilyContactFormValue,
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
import { SelectField } from '../../../shared/ui/select-field';

interface AdmissionsPanelProps {
  mode?: 'create' | 'edit';
  initialValues?: ResidentFormValues;
  isSavingResident: boolean;
  residentCount: number;
  residentNoticeTone: 'success' | 'error';
  residentNotice: string | null;
  panelEyebrow?: string;
  panelTitle?: string;
  panelDescription?: string;
  submitLabel?: string;
  secondaryAction?: {
    href: string;
    label: string;
  };
  onSubmit: (values: ResidentFormValues) => Promise<unknown>;
}

interface ValidationMessageProps {
  message?: string | null;
}

interface CollapsibleSectionProps {
  title: string;
  description: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

interface ToggleCardFieldProps {
  checked: boolean;
  label: string;
  name: string;
  onBlur: (event: ChangeEvent<HTMLInputElement>) => void;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

const textareaClassName = `${inputClassName} min-h-[132px] py-3`;
const innerPanelClassName =
  'rounded-[24px] border border-[rgba(0,102,132,0.08)] bg-brand-neutral/60 p-5';
const cuitFieldClassName =
  'grid min-h-[54px] grid-cols-[92px_minmax(0,1fr)_72px] items-center rounded-full border border-[rgba(0,102,132,0.14)] bg-brand-neutral px-4 transition focus-within:border-[rgba(0,102,132,0.28)] focus-within:ring-2 focus-within:ring-[rgba(0,102,132,0.12)]';
const cuitEditableSegmentClassName =
  'h-full min-w-0 border-0 bg-transparent px-0 text-center text-[1rem] text-brand-text outline-none';
const cuitReadonlySegmentClassName =
  'flex h-[30px] items-center justify-center border-x border-[rgba(0,102,132,0.1)] px-4 text-[1rem] text-brand-text-secondary';
const toggleCardClassName =
  'flex min-h-[70px] cursor-pointer items-center gap-3 rounded-[22px] border border-[rgba(0,102,132,0.1)] bg-white/70 px-4 py-3 text-brand-text transition hover:border-[rgba(0,102,132,0.18)]';
const documentIssuingCountrySelectOptions = documentIssuingCountryOptions.map(
  (country) => ({
    value: country,
    label: country,
  }),
);
const residentMaritalStatusSelectOptions = residentMaritalStatusOptions.map(
  (status) => ({
    value: status,
    label: status,
  }),
);

function ValidationMessage({ message }: ValidationMessageProps) {
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

function ToggleCardField({
  checked,
  label,
  name,
  onBlur,
  onChange,
}: ToggleCardFieldProps) {
  return (
    <label className={toggleCardClassName}>
      <input
        className="peer sr-only"
        type="checkbox"
        name={name}
        checked={checked}
        onBlur={onBlur}
        onChange={onChange}
      />
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[7px] border border-[rgba(0,102,132,0.22)] bg-white text-transparent transition peer-focus-visible:ring-4 peer-focus-visible:ring-[rgba(0,102,132,0.12)] peer-checked:border-brand-primary peer-checked:bg-brand-primary peer-checked:text-white">
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className="h-3.5 w-3.5"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M5.5 10.5L8.5 13.5L14.5 7.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="font-semibold">{label}</span>
    </label>
  );
}

function CollapsibleSection({
  title,
  description,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-[26px] border border-[rgba(0,102,132,0.1)] bg-white/90"
    >
      <summary
        tabIndex={-1}
        className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 outline-none [&::-webkit-details-marker]:hidden"
      >
        <div className="flex min-w-0 items-center gap-4">
          <span
            aria-hidden="true"
            className="h-12 w-[4px] shrink-0 rounded-full bg-[rgb(46,161,105)] opacity-0 transition-opacity duration-200 group-open:opacity-100"
          />

          <div className="grid gap-1">
            <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
              {title}
            </span>
            <span className="leading-[1.5] text-brand-text-secondary">
              {description}
            </span>
          </div>
        </div>

        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary transition-transform duration-200 group-open:rotate-180"
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 8L10 13L15 8"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </summary>

      <div className="border-t border-[rgba(0,102,132,0.08)] px-5 py-5">
        <div className="grid gap-[18px]">{children}</div>
      </div>
    </details>
  );
}

function getFieldMessage(
  errors: unknown,
  touched: unknown,
  path: string,
): string | undefined {
  return getIn(touched, path) ? (getIn(errors, path) as string) : undefined;
}

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

function getFamilyContactErrors(
  errors: unknown,
  index: number,
): Partial<Record<keyof ResidentFamilyContactFormValue, string>> {
  return (
    (getIn(errors, `familyContacts.${index}`) as Partial<
      Record<keyof ResidentFamilyContactFormValue, string>
    >) ?? {}
  );
}

function getFamilyContactTouched(
  touched: unknown,
  index: number,
): Partial<Record<keyof ResidentFamilyContactFormValue, boolean>> {
  return (
    (getIn(touched, `familyContacts.${index}`) as Partial<
      Record<keyof ResidentFamilyContactFormValue, boolean>
    >) ?? {}
  );
}

function getArrayError(errors: unknown, path: string): string | undefined {
  return typeof getIn(errors, path) === 'string'
    ? (getIn(errors, path) as string)
    : undefined;
}

function getAttachmentsError(errors: unknown): string | null {
  return typeof getIn(errors, 'attachments') === 'string'
    ? (getIn(errors, 'attachments') as string)
    : null;
}

function getCuitMessage(errors: unknown, touched: unknown): string | undefined {
  return (
    getFieldMessage(errors, touched, 'cuitPrefix') ??
    getFieldMessage(errors, touched, 'cuitSuffix')
  );
}

export function AdmissionsPanel({
  mode = 'create',
  initialValues,
  isSavingResident,
  residentCount,
  residentNoticeTone,
  residentNotice,
  panelEyebrow,
  panelTitle,
  panelDescription,
  submitLabel,
  secondaryAction,
  onSubmit,
}: AdmissionsPanelProps) {
  const [createInitialValues] = useState<ResidentFormValues>(() => ({
    ...residentFormInitialValues,
    admissionDate: formatCurrentDateForResidentInput(),
  }));
  const formInitialValues = useMemo(
    () =>
      initialValues ?? createInitialValues,
    [createInitialValues, initialValues],
  );
  const [cuitDocumentSegment, setCuitDocumentSegment] = useState(
    getResidentDocumentDigits(formInitialValues.documentNumber),
  );
  const resolvedPanelEyebrow = panelEyebrow ?? (mode === 'edit' ? 'Edicion' : 'Alta');
  const resolvedPanelTitle =
    panelTitle ?? (mode === 'edit' ? 'Editar paciente' : 'Agregar paciente');
  const resolvedPanelDescription =
    panelDescription ??
    (mode === 'edit'
      ? 'En esta etapa la edicion actualiza solo el perfil base y el estado actual del residente. Los antecedentes, contactos, adjuntos y otros registros de ingreso se conservan sin reescribirse desde este formulario.'
      : 'El alta ahora se completa por bloques desplegables para separar identificacion, contacto, cobertura, salud, pertenencias, familiares y adjuntos. La fecha de ingreso se precarga con hoy y la edad se calcula automaticamente desde la fecha de nacimiento.');
  const resolvedSubmitLabel =
    submitLabel ?? (mode === 'edit' ? 'Guardar cambios' : 'Guardar paciente');
  const isCreateMode = mode === 'create';

  useEffect(() => {
    setCuitDocumentSegment(getResidentDocumentDigits(formInitialValues.documentNumber));
  }, [formInitialValues.documentNumber]);

  return (
    <article id="intake-panel" className={surfaceCardClassName}>
      <div className="mb-[18px] flex items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-primary">
            {resolvedPanelEyebrow}
          </span>
          <h2 className="mt-1 text-[1.35rem] font-bold tracking-[-0.04em] text-brand-text">
            {resolvedPanelTitle}
          </h2>
        </div>
        <span
          className={`${badgeBaseClassName} bg-brand-primary/12 text-brand-primary`}
        >
          {residentCount} residentes
        </span>
      </div>

      <p className="leading-[1.65] text-brand-text-secondary">
        {resolvedPanelDescription}
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
        enableReinitialize
        initialValues={formInitialValues}
        validationSchema={
          isCreateMode ? residentIntakeSchema : residentBaseUpdateSchema
        }
        onSubmit={async (values, helpers) => {
          await onSubmit(values);
          setCuitDocumentSegment(getResidentDocumentDigits(values.documentNumber));

          if (isCreateMode) {
            setCuitDocumentSegment('');
            helpers.resetForm({
              values: {
                ...residentFormInitialValues,
                admissionDate: formatCurrentDateForResidentInput(),
              },
            });
          }
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
          const cuitMessage = getCuitMessage(errors, touched);

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
              <CollapsibleSection
                title="Identificacion e ingreso"
                description="Documento, tramite, CUIT, fecha de ingreso y ubicacion del paciente."
                defaultOpen
              >
                <div className="grid gap-[14px] min-[980px]:grid-cols-3">
                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      Fecha ingreso
                    </span>
                    <input
                      className={inputClassName}
                      type="text"
                      name="admissionDate"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="DD/MM/YYYY"
                      value={values.admissionDate}
                      onBlur={handleBlur}
                      onChange={(event) => {
                        void setFieldValue(
                          'admissionDate',
                          formatResidentDateInput(event.target.value),
                        );
                      }}
                    />
                    <ValidationMessage
                      message={getFieldMessage(
                        errors,
                        touched,
                        'admissionDate',
                      )}
                    />
                  </label>

                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      Habitacion / cama
                    </span>
                    <input
                      className={inputClassName}
                      type="text"
                      name="room"
                      value={values.room}
                      onBlur={handleBlur}
                      onChange={handleChange}
                    />
                    <ValidationMessage
                      message={getFieldMessage(errors, touched, 'room')}
                    />
                  </label>

                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      Nivel de cuidado
                    </span>
                    <SelectField
                      name="careLevel"
                      value={values.careLevel}
                      options={residentCareLevelOptions}
                      onBlur={() => {
                        void setFieldTouched('careLevel', true);
                      }}
                      onChange={(nextValue) => {
                        void setFieldValue('careLevel', nextValue);
                      }}
                    />
                    <ValidationMessage
                      message={getFieldMessage(errors, touched, 'careLevel')}
                    />
                  </label>
                </div>

                <div className="grid gap-[14px] min-[980px]:grid-cols-3">
                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      Tipo de documento
                    </span>
                    <SelectField
                      name="documentType"
                      value={values.documentType}
                      options={residentDocumentTypeOptions}
                      allowEmptyOption
                      onBlur={() => {
                        void setFieldTouched('documentType', true);
                      }}
                      onChange={(nextValue) => {
                        void setFieldValue('documentType', nextValue);
                      }}
                    />
                    <ValidationMessage
                      message={getFieldMessage(errors, touched, 'documentType')}
                    />
                  </label>

                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      DNI / documento
                    </span>
                    <input
                      className={inputClassName}
                      type="text"
                      name="documentNumber"
                      value={values.documentNumber}
                      onBlur={handleBlur}
                      onChange={(event) => {
                        handleChange(event);
                        setCuitDocumentSegment(
                          getResidentDocumentDigits(event.target.value),
                        );
                      }}
                    />
                    <ValidationMessage
                      message={getFieldMessage(
                        errors,
                        touched,
                        'documentNumber',
                      )}
                    />
                  </label>

                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      Pais emisor
                    </span>
                    <SelectField
                      name="documentIssuingCountry"
                      value={values.documentIssuingCountry}
                      options={documentIssuingCountrySelectOptions}
                      onBlur={() => {
                        void setFieldTouched('documentIssuingCountry', true);
                      }}
                      onChange={(nextValue) => {
                        void setFieldValue('documentIssuingCountry', nextValue);
                      }}
                    />
                    <ValidationMessage
                      message={getFieldMessage(
                        errors,
                        touched,
                        'documentIssuingCountry',
                      )}
                    />
                  </label>
                </div>

                <div className="grid gap-[14px] min-[980px]:grid-cols-2">
                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      Num de tramite
                    </span>
                    <input
                      className={inputClassName}
                      type="text"
                      name="procedureNumber"
                      value={values.procedureNumber}
                      onBlur={handleBlur}
                      onChange={handleChange}
                    />
                    <ValidationMessage />
                  </label>

                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      CUIT
                    </span>
                    <div className={cuitFieldClassName}>
                      <input
                        className={cuitEditableSegmentClassName}
                        type="text"
                        inputMode="numeric"
                        maxLength={2}
                        name="cuitPrefix"
                        value={values.cuitPrefix}
                        onBlur={handleBlur}
                        onChange={(event) => {
                          void setFieldValue(
                            'cuitPrefix',
                            formatResidentDigitsInput(event.target.value, 2),
                          );
                        }}
                      />

                      <div
                        aria-live="polite"
                        className={cuitReadonlySegmentClassName}
                      >
                        {cuitDocumentSegment}
                      </div>

                      <input
                        className={cuitEditableSegmentClassName}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        name="cuitSuffix"
                        value={values.cuitSuffix}
                        onBlur={handleBlur}
                        onChange={(event) => {
                          void setFieldValue(
                            'cuitSuffix',
                            formatResidentDigitsInput(event.target.value, 1),
                          );
                        }}
                      />
                    </div>
                    <ValidationMessage message={cuitMessage} />
                  </label>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="Datos personales"
                description="Nombre completo, nacimiento, sexo, estado civil, nacionalidad y correo."
                defaultOpen
              >
                <div className="grid gap-[14px] min-[980px]:grid-cols-2">
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
                    <ValidationMessage
                      message={getFieldMessage(errors, touched, 'firstName')}
                    />
                  </label>

                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      Otros nombres
                    </span>
                    <input
                      className={inputClassName}
                      type="text"
                      name="middleNames"
                      value={values.middleNames}
                      onBlur={handleBlur}
                      onChange={handleChange}
                    />
                    <ValidationMessage />
                  </label>

                </div>

                <div className="grid gap-[14px] min-[980px]:grid-cols-2">
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
                    <ValidationMessage
                      message={getFieldMessage(errors, touched, 'lastName')}
                    />
                  </label>

                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      Otros apellidos
                    </span>
                    <input
                      className={inputClassName}
                      type="text"
                      name="otherLastNames"
                      value={values.otherLastNames}
                      onBlur={handleBlur}
                      onChange={handleChange}
                    />
                    <ValidationMessage />
                  </label>
                </div>

                <div className="grid gap-[14px] min-[980px]:grid-cols-3">
                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      Fecha nacimiento
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
                    <ValidationMessage
                      message={getFieldMessage(errors, touched, 'birthDate')}
                    />
                  </label>

                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      Edad
                    </span>
                    <input
                      className={`${inputClassName} cursor-default bg-white text-brand-text`}
                      type="text"
                      value={computedAge === null ? '' : `${computedAge} años`}
                      readOnly
                      tabIndex={-1}
                    />
                    <ValidationMessage />
                  </label>

                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      Sexo
                    </span>
                    <SelectField
                      name="sex"
                      value={values.sex}
                      options={residentSexOptions}
                      allowEmptyOption
                      onBlur={() => {
                        void setFieldTouched('sex', true);
                      }}
                      onChange={(nextValue) => {
                        void setFieldValue('sex', nextValue);
                      }}
                    />
                    <ValidationMessage
                      message={getFieldMessage(errors, touched, 'sex')}
                    />
                  </label>

                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      Estado civil
                    </span>
                    <SelectField
                      name="maritalStatus"
                      value={values.maritalStatus}
                      options={residentMaritalStatusSelectOptions}
                      allowEmptyOption
                      onBlur={() => {
                        void setFieldTouched('maritalStatus', true);
                      }}
                      onChange={(nextValue) => {
                        void setFieldValue('maritalStatus', nextValue);
                      }}
                    />
                    <ValidationMessage />
                  </label>

                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      Nacionalidad
                    </span>
                    <input
                      className={inputClassName}
                      type="text"
                      name="nationality"
                      value={values.nationality}
                      onBlur={handleBlur}
                      onChange={handleChange}
                    />
                    <ValidationMessage />
                  </label>

                  <label className="grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      Correo electronico
                    </span>
                    <input
                      className={inputClassName}
                      type="email"
                      name="email"
                      value={values.email}
                      onBlur={handleBlur}
                      onChange={handleChange}
                    />
                    <ValidationMessage
                      message={getFieldMessage(errors, touched, 'email')}
                    />
                  </label>
                </div>
              </CollapsibleSection>

              {isCreateMode && (
                <>
                  <CollapsibleSection
                    title="Cobertura, traslados y psiquiatria"
                    description="Obra social, beneficios, datos del traslado y referencias de psiquiatria."
                  >
                <div className="grid gap-[18px] min-[1120px]:grid-cols-3">
                  <article className={innerPanelClassName}>
                    <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                      Obra social
                    </span>
                    <div className="mt-4 grid gap-[14px]">
                      <label className="grid gap-2.5">
                        <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                          Obra social
                        </span>
                        <input
                          className={inputClassName}
                          type="text"
                          name="insurance.provider"
                          value={values.insurance.provider}
                          onBlur={handleBlur}
                          onChange={handleChange}
                        />
                        <ValidationMessage />
                      </label>

                      <label className="grid gap-2.5">
                        <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                          Numero de beneficiario
                        </span>
                        <input
                          className={inputClassName}
                          type="text"
                          name="insurance.memberNumber"
                          value={values.insurance.memberNumber}
                          onBlur={handleBlur}
                          onChange={handleChange}
                        />
                        <ValidationMessage />
                      </label>
                    </div>
                  </article>

                  <article className={innerPanelClassName}>
                    <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                      Traslados
                    </span>
                    <div className="mt-4 grid gap-[14px]">
                      <label className="grid gap-2.5">
                        <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                          Prestador / ambulancia
                        </span>
                        <input
                          className={inputClassName}
                          type="text"
                          name="transfer.provider"
                          value={values.transfer.provider}
                          onBlur={handleBlur}
                          onChange={handleChange}
                        />
                        <ValidationMessage />
                      </label>

                      <label className="grid gap-2.5">
                        <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                          Domicilio traslado
                        </span>
                        <input
                          className={inputClassName}
                          type="text"
                          name="transfer.address"
                          value={values.transfer.address}
                          onBlur={handleBlur}
                          onChange={handleChange}
                        />
                        <ValidationMessage />
                      </label>

                      <label className="grid gap-2.5">
                        <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                          Telefono traslado
                        </span>
                        <input
                          className={inputClassName}
                          type="text"
                          name="transfer.phone"
                          value={values.transfer.phone}
                          onBlur={handleBlur}
                          onChange={handleChange}
                        />
                        <ValidationMessage />
                      </label>
                    </div>
                  </article>

                  <article className={innerPanelClassName}>
                    <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                      Psiquiatria
                    </span>
                    <div className="mt-4 grid gap-[14px]">
                      <label className="grid gap-2.5">
                        <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                          Prestador
                        </span>
                        <input
                          className={inputClassName}
                          type="text"
                          name="psychiatry.provider"
                          value={values.psychiatry.provider}
                          onBlur={handleBlur}
                          onChange={handleChange}
                        />
                        <ValidationMessage />
                      </label>

                      <label className="grid gap-2.5">
                        <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                          Lugar de atencion
                        </span>
                        <input
                          className={inputClassName}
                          type="text"
                          name="psychiatry.careLocation"
                          value={values.psychiatry.careLocation}
                          onBlur={handleBlur}
                          onChange={handleChange}
                        />
                        <ValidationMessage />
                      </label>

                      <label className="grid gap-2.5">
                        <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                          Domicilio
                        </span>
                        <input
                          className={inputClassName}
                          type="text"
                          name="psychiatry.address"
                          value={values.psychiatry.address}
                          onBlur={handleBlur}
                          onChange={handleChange}
                        />
                        <ValidationMessage />
                      </label>

                      <label className="grid gap-2.5">
                        <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                          Telefono
                        </span>
                        <input
                          className={inputClassName}
                          type="text"
                          name="psychiatry.phone"
                          value={values.psychiatry.phone}
                          onBlur={handleBlur}
                          onChange={handleChange}
                        />
                        <ValidationMessage />
                      </label>
                    </div>
                  </article>
                </div>
              </CollapsibleSection>

              <FieldArray name="medicalHistory">
                {({ push, remove }) => (
                  <CollapsibleSection
                    title="Salud y seguimiento medico"
                    description="Alergias, medico de cabecera, patologias, habitos y antecedentes del paciente."
                    defaultOpen
                  >
                    <article className={innerPanelClassName}>
                      <div className="grid gap-[14px] min-[980px]:grid-cols-3">
                        <label className="grid gap-2.5">
                          <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                            Alergias
                          </span>
                          <textarea
                            className={`${textareaClassName} min-h-[110px]`}
                            name="clinicalProfile.allergies"
                            value={values.clinicalProfile.allergies}
                            onBlur={handleBlur}
                            onChange={handleChange}
                          />
                          <ValidationMessage />
                        </label>

                        <label className="grid gap-2.5">
                          <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                            Lugar atencion emergencia
                          </span>
                          <input
                            className={inputClassName}
                            type="text"
                            name="clinicalProfile.emergencyCareLocation"
                            value={values.clinicalProfile.emergencyCareLocation}
                            onBlur={handleBlur}
                            onChange={handleChange}
                          />
                          <ValidationMessage />
                        </label>

                        <label className="grid gap-2.5">
                          <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                            Hist clinica
                          </span>
                          <input
                            className={inputClassName}
                            type="text"
                            name="clinicalProfile.clinicalRecordNumber"
                            value={values.clinicalProfile.clinicalRecordNumber}
                            onBlur={handleBlur}
                            onChange={handleChange}
                          />
                          <ValidationMessage />
                        </label>
                      </div>

                      <div className="mt-[14px] grid gap-[14px] min-[980px]:grid-cols-3">
                        <label className="grid gap-2.5">
                          <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                            Medico cabecera
                          </span>
                          <input
                            className={inputClassName}
                            type="text"
                            name="clinicalProfile.primaryDoctorName"
                            value={values.clinicalProfile.primaryDoctorName}
                            onBlur={handleBlur}
                            onChange={handleChange}
                          />
                          <ValidationMessage />
                        </label>

                        <label className="grid gap-2.5">
                          <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                            Domicilio consultorio
                          </span>
                          <input
                            className={inputClassName}
                            type="text"
                            name="clinicalProfile.primaryDoctorOfficeAddress"
                            value={values.clinicalProfile.primaryDoctorOfficeAddress}
                            onBlur={handleBlur}
                            onChange={handleChange}
                          />
                          <ValidationMessage />
                        </label>

                        <label className="grid gap-2.5">
                          <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                            Telefono consultorio
                          </span>
                          <input
                            className={inputClassName}
                            type="text"
                            name="clinicalProfile.primaryDoctorOfficePhone"
                            value={values.clinicalProfile.primaryDoctorOfficePhone}
                            onBlur={handleBlur}
                            onChange={handleChange}
                          />
                          <ValidationMessage />
                        </label>
                      </div>

                      <div className="mt-[14px] grid gap-[14px] min-[980px]:grid-cols-2">
                        <label className="grid gap-2.5">
                          <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                            Patologias
                          </span>
                          <textarea
                            className={textareaClassName}
                            name="clinicalProfile.pathologies"
                            value={values.clinicalProfile.pathologies}
                            onBlur={handleBlur}
                            onChange={handleChange}
                          />
                          <ValidationMessage />
                        </label>

                        <label className="grid gap-2.5">
                          <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                            Operaciones, cirugias y otros antecedentes
                          </span>
                          <textarea
                            className={textareaClassName}
                            name="clinicalProfile.surgeries"
                            value={values.clinicalProfile.surgeries}
                            onBlur={handleBlur}
                            onChange={handleChange}
                          />
                          <ValidationMessage />
                        </label>
                      </div>

                      <div className="mt-[14px] grid gap-[14px] min-[980px]:grid-cols-3">
                        <label className="grid gap-2.5">
                          <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                            Fuma
                          </span>
                          <SelectField
                            name="clinicalProfile.smokes"
                            value={values.clinicalProfile.smokes}
                            options={residentBooleanAnswerOptions}
                            allowEmptyOption
                            onBlur={() => {
                              void setFieldTouched('clinicalProfile.smokes', true);
                            }}
                            onChange={(nextValue) => {
                              void setFieldValue(
                                'clinicalProfile.smokes',
                                nextValue,
                              );
                            }}
                          />
                          <ValidationMessage />
                        </label>

                        <label className="grid gap-2.5">
                          <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                            Bebe alcohol
                          </span>
                          <SelectField
                            name="clinicalProfile.drinksAlcohol"
                            value={values.clinicalProfile.drinksAlcohol}
                            options={residentBooleanAnswerOptions}
                            allowEmptyOption
                            onBlur={() => {
                              void setFieldTouched(
                                'clinicalProfile.drinksAlcohol',
                                true,
                              );
                            }}
                            onChange={(nextValue) => {
                              void setFieldValue(
                                'clinicalProfile.drinksAlcohol',
                                nextValue,
                              );
                            }}
                          />
                          <ValidationMessage />
                        </label>

                        <label className="grid gap-2.5">
                          <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                            Peso del corriente mes
                          </span>
                          <input
                            className={inputClassName}
                            type="text"
                            name="clinicalProfile.currentWeightKg"
                            value={values.clinicalProfile.currentWeightKg}
                            onBlur={handleBlur}
                            onChange={handleChange}
                            placeholder="Ej. 62.5"
                          />
                          <ValidationMessage
                            message={getFieldMessage(
                              errors,
                              touched,
                              'clinicalProfile.currentWeightKg',
                            )}
                          />
                        </label>
                      </div>
                    </article>

                    <article className={innerPanelClassName}>
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

                      <ValidationMessage
                        message={getArrayError(errors, 'medicalHistory')}
                      />

                      {values.medicalHistory.length === 0 ? (
                        <div className="rounded-[24px] border border-dashed border-[rgba(0,102,132,0.22)] bg-white/70 px-5 py-5 text-brand-text-secondary">
                          Todavia no cargaste antecedentes. Puedes sumar
                          diagnosticos, cirugias, internaciones o notas
                          clinicas relevantes para el ingreso.
                        </div>
                      ) : (
                        <div className="grid gap-[14px]">
                          {values.medicalHistory.map((entry, index) => {
                            const entryErrors = getEntryErrors(errors, index);
                            const entryTouched = getEntryTouched(touched, index);

                            return (
                              <article
                                key={entry.localId}
                                className="rounded-[24px] border border-[rgba(0,102,132,0.08)] bg-white/70 p-5"
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
                                    <ValidationMessage
                                      message={
                                        entryTouched.recordedAt
                                          ? entryErrors.recordedAt
                                          : undefined
                                      }
                                    />
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
                                    <ValidationMessage
                                      message={
                                        entryTouched.title
                                          ? entryErrors.title
                                          : undefined
                                      }
                                    />
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
                                  <ValidationMessage
                                    message={
                                      entryTouched.notes
                                        ? entryErrors.notes
                                        : undefined
                                    }
                                  />
                                </label>
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </article>
                  </CollapsibleSection>
                )}
              </FieldArray>

              <FieldArray name="familyContacts">
                {({ push, remove }) => (
                  <CollapsibleSection
                    title="Familiares y contactos"
                    description="Permite cargar uno o varios contactos de referencia con parentesco, telefono, direccion y notas."
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                        Contactos familiares
                      </span>
                      <button
                        className={secondaryButtonClassName}
                        type="button"
                        onClick={() => push(createEmptyFamilyContact())}
                      >
                        Agregar familiar
                      </button>
                    </div>

                    <ValidationMessage
                      message={getArrayError(errors, 'familyContacts')}
                    />

                    {values.familyContacts.length === 0 ? (
                      <div className="rounded-[24px] border border-dashed border-[rgba(0,102,132,0.22)] bg-brand-neutral/60 px-5 py-5 text-brand-text-secondary">
                        Aun no cargaste familiares. Puedes agregar hijos,
                        apoderados, referentes o cualquier contacto relevante.
                      </div>
                    ) : (
                      <div className="grid gap-[14px]">
                        {values.familyContacts.map((contact, index) => {
                          const contactErrors = getFamilyContactErrors(
                            errors,
                            index,
                          );
                          const contactTouched = getFamilyContactTouched(
                            touched,
                            index,
                          );

                          return (
                            <article
                              key={contact.localId}
                              className={innerPanelClassName}
                            >
                              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                                  Familiar {index + 1}
                                </span>
                                <button
                                  className={secondaryButtonClassName}
                                  type="button"
                                  onClick={() => remove(index)}
                                >
                                  Quitar
                                </button>
                              </div>

                              <div className="grid gap-[14px] min-[980px]:grid-cols-3">
                                <label className="grid gap-2.5">
                                  <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                                    Nombre y apellido
                                  </span>
                                  <input
                                    className={inputClassName}
                                    type="text"
                                    name={`familyContacts.${index}.fullName`}
                                    value={contact.fullName}
                                    onBlur={handleBlur}
                                    onChange={handleChange}
                                  />
                                  <ValidationMessage
                                    message={
                                      contactTouched.fullName
                                        ? contactErrors.fullName
                                        : undefined
                                    }
                                  />
                                </label>

                                <label className="grid gap-2.5">
                                  <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                                    Relacion
                                  </span>
                                  <input
                                    className={inputClassName}
                                    type="text"
                                    name={`familyContacts.${index}.relationship`}
                                    value={contact.relationship}
                                    onBlur={handleBlur}
                                    onChange={handleChange}
                                  />
                                  <ValidationMessage
                                    message={
                                      contactTouched.relationship
                                        ? contactErrors.relationship
                                        : undefined
                                    }
                                  />
                                </label>

                                <label className="grid gap-2.5">
                                  <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                                    Telefono
                                  </span>
                                  <input
                                    className={inputClassName}
                                    type="text"
                                    name={`familyContacts.${index}.phone`}
                                    value={contact.phone}
                                    onBlur={handleBlur}
                                    onChange={handleChange}
                                  />
                                  <ValidationMessage
                                    message={
                                      contactTouched.phone
                                        ? contactErrors.phone
                                        : undefined
                                    }
                                  />
                                </label>
                              </div>

                              <div className="mt-[14px] grid gap-[14px] min-[980px]:grid-cols-2">
                                <label className="grid gap-2.5">
                                  <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                                    Correo electronico
                                  </span>
                                  <input
                                    className={inputClassName}
                                    type="email"
                                    name={`familyContacts.${index}.email`}
                                    value={contact.email}
                                    onBlur={handleBlur}
                                    onChange={handleChange}
                                  />
                                  <ValidationMessage
                                    message={
                                      contactTouched.email
                                        ? contactErrors.email
                                        : undefined
                                    }
                                  />
                                </label>

                                <label className="grid gap-2.5">
                                  <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                                    Direccion
                                  </span>
                                  <input
                                    className={inputClassName}
                                    type="text"
                                    name={`familyContacts.${index}.address`}
                                    value={contact.address}
                                    onBlur={handleBlur}
                                    onChange={handleChange}
                                  />
                                  <ValidationMessage />
                                </label>
                              </div>

                              <label className="mt-[14px] grid gap-2.5">
                                <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                                  Notas
                                </span>
                                <textarea
                                  className={`${textareaClassName} min-h-[110px]`}
                                  name={`familyContacts.${index}.notes`}
                                  value={contact.notes}
                                  onBlur={handleBlur}
                                  onChange={handleChange}
                                />
                                <ValidationMessage />
                              </label>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </CollapsibleSection>
                )}
              </FieldArray>

              <CollapsibleSection
                title="Pertenencias"
                description="Marca lo que trae el paciente al ingreso y deja registradas observaciones utiles."
              >
                <article className={innerPanelClassName}>
                  <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                    Pertenencias
                  </span>

                  <div className="mt-4 grid gap-3 min-[900px]:grid-cols-2">
                    <ToggleCardField
                      name="belongings.glasses"
                      label="Anteojos"
                      checked={values.belongings.glasses}
                      onBlur={handleBlur}
                      onChange={handleChange}
                    />

                    <ToggleCardField
                      name="belongings.dentures"
                      label="Dentaduras"
                      checked={values.belongings.dentures}
                      onBlur={handleBlur}
                      onChange={handleChange}
                    />

                    <ToggleCardField
                      name="belongings.walker"
                      label="Andador"
                      checked={values.belongings.walker}
                      onBlur={handleBlur}
                      onChange={handleChange}
                    />

                    <ToggleCardField
                      name="belongings.orthopedicBed"
                      label="Cama ortopedica"
                      checked={values.belongings.orthopedicBed}
                      onBlur={handleBlur}
                      onChange={handleChange}
                    />
                  </div>

                  <label className="mt-[14px] grid gap-2.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                      Otras pertenencias o notas
                    </span>
                    <textarea
                      className={`${textareaClassName} min-h-[110px]`}
                      name="belongings.notes"
                      value={values.belongings.notes}
                      onBlur={handleBlur}
                      onChange={handleChange}
                    />
                    <ValidationMessage />
                  </label>
                </article>
              </CollapsibleSection>

              <CollapsibleSection
                title="Adjuntos clinicos"
                description="Sube imagenes o PDF de estudios, ordenes, carnets, informes y documentos relevantes."
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                    Adjuntos
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
                  <ValidationMessage message={attachmentsError} />
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
                              {formatResidentAttachmentKind(attachment.kind)} |{' '}
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
                  </CollapsibleSection>
                </>
              )}

              <div className="flex flex-wrap items-center gap-3">
                {secondaryAction && (
                  <Link className={secondaryButtonClassName} to={secondaryAction.href}>
                    {secondaryAction.label}
                  </Link>
                )}
                <button
                  className={primaryButtonClassName}
                  type="button"
                  disabled={isSavingResident}
                  onClick={() => {
                    void submitForm();
                  }}
                >
                  {isSavingResident ? 'Guardando...' : resolvedSubmitLabel}
                </button>
              </div>
            </form>
          );
        }}
      </Formik>
    </article>
  );
}
