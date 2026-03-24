import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import type { AuthSession, ResidentDetail } from '@gentrix/shared-types';

import {
  formatEntityStatus,
  formatResidentAttachmentKind,
  formatResidentCareLevel,
  formatResidentDocumentType,
  formatResidentSex,
} from '../../../shared/lib/display-labels';
import {
  badgeBaseClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  shellCardClassName,
  surfaceCardClassName,
} from '../../../shared/ui/class-names';
import { BackChevronButton } from '../../../shared/ui/back-chevron-button';
import { WorkspaceShell } from '../../dashboard/ui/workspace-shell';
import { StatusNotice } from '../../dashboard/ui/status-notice';
import type { DashboardScreenState } from '../../dashboard/types/dashboard-screen-state';

interface ResidentDetailWorkspaceProps {
  screenState: DashboardScreenState;
  session: AuthSession;
  residentCount: number;
  resident: ResidentDetail | null;
  residentError: string | null;
  onLogout: () => void | Promise<void>;
  onRetry: () => void | Promise<void>;
}

interface DetailFieldProps {
  label: string;
  value: string;
}

interface ResidentDetailLocationState {
  residentNotice?: string;
  residentNoticeTone?: 'success' | 'error';
}

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'long',
});

function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

function formatAttachmentSize(sizeBytes: number): string {
  if (sizeBytes >= 1_000_000) {
    return `${(sizeBytes / 1_000_000).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(sizeBytes / 1_000))} KB`;
}

function showValue(value: string | undefined): string {
  if (!value || !value.trim()) {
    return 'No informado';
  }

  return value;
}

function showDateValue(value: string | undefined): string {
  return value ? formatDate(value) : 'No informado';
}

function showBooleanValue(value: boolean | undefined): string {
  if (value === undefined) {
    return 'No informado';
  }

  return value ? 'Si' : 'No';
}

function showWeight(value: number | undefined): string {
  return typeof value === 'number' ? `${value.toFixed(1)} kg` : 'No informado';
}

function DetailField({ label, value }: DetailFieldProps) {
  return (
    <div>
      <strong className="block text-brand-text">{label}</strong>
      <span>{value}</span>
    </div>
  );
}

export function ResidentDetailWorkspace({
  screenState,
  session,
  residentCount,
  resident,
  residentError,
  onLogout,
  onRetry,
}: ResidentDetailWorkspaceProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const detailLocationState =
    (location.state as ResidentDetailLocationState | null) ?? null;
  const residentNotice = detailLocationState?.residentNotice ?? null;
  const residentNoticeTone = detailLocationState?.residentNoticeTone ?? 'success';
  const headerDetails = resident
    ? [
        {
          label: 'Ingreso',
          value: showDateValue(resident.admissionDate),
        },
        {
          label: 'Nacimiento',
          value: showDateValue(resident.birthDate),
        },
        {
          label: 'Edad',
          value: `${resident.age} años`,
        },
      ]
    : [];
  const overviewDetails = resident
    ? [
        {
          label: 'Interno',
          value: showValue(resident.internalNumber),
        },
        {
          label: 'Habitacion',
          value: showValue(resident.room),
        },
        {
          label: 'Cuidado',
          value: formatResidentCareLevel(resident.careLevel),
        },
      ]
    : [];

  useEffect(() => {
    if (!residentNotice) {
      return;
    }

    navigate(location.pathname, {
      replace: true,
      state: null,
    });
  }, [location.pathname, navigate, residentNotice]);

  return (
    <WorkspaceShell
      residentCount={residentCount}
      session={session}
      onLogout={onLogout}
    >
      <section
        className={`${shellCardClassName} flex flex-wrap items-start justify-between gap-5 px-7 py-6`}
      >
        <div className="grid gap-2.5">
          <div className="flex items-center gap-3">
            <BackChevronButton
              title="Volver a residentes"
              fallbackTo="/residentes"
            />
            <span className="inline-flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-primary">
              Residentes
            </span>
          </div>
          <h1 className="text-[clamp(2rem,3.2vw,2.6rem)] font-bold tracking-[-0.04em] text-brand-text">
            {resident?.fullName ?? 'Detalle del residente'}
          </h1>
          {resident ? (
            <div className="grid gap-3 pt-1 min-[680px]:grid-cols-3">
              {headerDetails.map((detail) => (
                <article
                  key={detail.label}
                  className="rounded-[20px] bg-brand-neutral px-4 py-3"
                >
                  <span className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
                    {detail.label}
                  </span>
                  <strong className="mt-1.5 block text-brand-text">
                    {detail.value}
                  </strong>
                </article>
              ))}
            </div>
          ) : (
            <p className="max-w-[58ch] leading-[1.65] text-brand-text-secondary">
              Consulta la ficha actual del residente y sus datos principales.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {resident ? (
            <Link
              className={primaryButtonClassName}
              to={`/residentes/${resident.id}/editar`}
            >
              Editar paciente
            </Link>
          ) : (
            <button
              className={`${primaryButtonClassName} cursor-not-allowed opacity-70`}
              type="button"
              disabled
            >
              Editar paciente
            </button>
          )}
        </div>
      </section>

      {residentNotice && (
        <section
          className={`${shellCardClassName} px-6 py-[22px] ${
            residentNoticeTone === 'error'
              ? 'border border-[rgba(168,43,17,0.16)] bg-[rgba(168,43,17,0.08)] text-[rgb(130,44,25)]'
              : 'border border-[rgba(0,102,132,0.14)] bg-[rgba(0,102,132,0.08)] text-brand-secondary'
          }`}
        >
          <span className="leading-[1.55]">{residentNotice}</span>
        </section>
      )}

      {screenState === 'loading' && (
        <StatusNotice message="Cargando el detalle del residente." />
      )}

      {screenState === 'error' && (
        <StatusNotice
          title="No pude cargar la ficha del residente."
          message={residentError ?? 'Ocurrio un error inesperado.'}
          actions={[
            {
              label: 'Reintentar',
              onClick: onRetry,
            },
            {
              label: 'Volver a residentes',
              onClick: () => navigate(-1),
              variant: 'secondary',
            },
          ]}
        />
      )}

      {screenState === 'ready' && resident && (
        <>
          <section
            className={`${surfaceCardClassName} grid gap-5 min-[980px]:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]`}
          >
            <div className="grid gap-4">
              <span
                className={`${badgeBaseClassName} w-fit bg-brand-primary/12 text-brand-primary`}
              >
                {formatEntityStatus(resident.status)}
              </span>
              <div className="grid gap-3 min-[680px]:grid-cols-3">
                {overviewDetails.map((detail) => (
                  <article
                    key={detail.label}
                    className="rounded-[22px] bg-brand-neutral px-4 py-4"
                  >
                    <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
                      {detail.label}
                    </span>
                    <strong className="mt-2 block text-brand-text">
                      {detail.value}
                    </strong>
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] bg-brand-neutral px-5 py-5">
              <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                Contacto principal
              </span>
              <div className="mt-4 grid gap-2.5">
                <strong className="text-brand-text">
                  {resident.emergencyContact.fullName}
                </strong>
                <span className="text-brand-text-secondary">
                  {resident.emergencyContact.relationship}
                </span>
                <span className="text-brand-text-secondary">
                  {resident.emergencyContact.phone}
                </span>
                {resident.emergencyContact.email && (
                  <span className="text-brand-text-secondary">
                    {resident.emergencyContact.email}
                  </span>
                )}
              </div>
            </div>
          </section>

          <section className="grid gap-[18px] min-[980px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <article className={surfaceCardClassName}>
              <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                Identificacion
              </span>
              <div className="mt-4 grid gap-3 text-brand-text-secondary">
                <DetailField
                  label="Documento"
                  value={`${formatResidentDocumentType(resident.documentType)} ${resident.documentNumber}`}
                />
                <DetailField
                  label="Pais emisor"
                  value={showValue(resident.documentIssuingCountry)}
                />
                <DetailField
                  label="Numero de tramite"
                  value={showValue(resident.procedureNumber)}
                />
                <DetailField
                  label="CUIT"
                  value={showValue(resident.cuil)}
                />
              </div>
            </article>

            <article className={surfaceCardClassName}>
              <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                Datos personales
              </span>
              <div className="mt-4 grid gap-3 text-brand-text-secondary">
                <DetailField label="Nombre" value={resident.firstName} />
                <DetailField
                  label="Otros nombres"
                  value={showValue(resident.middleNames)}
                />
                <DetailField label="Apellido" value={resident.lastName} />
                <DetailField
                  label="Otros apellidos"
                  value={showValue(resident.otherLastNames)}
                />
                <DetailField
                  label="Sexo"
                  value={formatResidentSex(resident.sex)}
                />
                <DetailField
                  label="Estado civil"
                  value={showValue(resident.maritalStatus)}
                />
                <DetailField
                  label="Nacionalidad"
                  value={showValue(resident.nationality)}
                />
                <DetailField
                  label="Correo electronico"
                  value={showValue(resident.email)}
                />
              </div>
            </article>

            <article className={surfaceCardClassName}>
              <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                Ingreso y salida
              </span>
              <div className="mt-4 grid gap-3 text-brand-text-secondary">
                <DetailField
                  label="Habitacion"
                  value={showValue(resident.room)}
                />
                <DetailField
                  label="Nivel de cuidado"
                  value={formatResidentCareLevel(resident.careLevel)}
                />
                <DetailField
                  label="Fecha de ingreso"
                  value={formatDate(resident.admissionDate)}
                />
                <DetailField
                  label="Fecha de salida"
                  value={showDateValue(resident.discharge.date)}
                />
                <DetailField
                  label="Motivo de salida"
                  value={showValue(resident.discharge.reason)}
                />
              </div>
            </article>
          </section>

          <section className="grid gap-[18px] min-[980px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <article className={surfaceCardClassName}>
              <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                Cobertura y traslados
              </span>
              <div className="mt-4 grid gap-3 text-brand-text-secondary">
                <DetailField
                  label="Obra social"
                  value={showValue(resident.insurance.provider)}
                />
                <DetailField
                  label="Numero de beneficio"
                  value={showValue(resident.insurance.memberNumber)}
                />
                <DetailField
                  label="Proveedor de traslados"
                  value={showValue(resident.transfer.provider)}
                />
                <DetailField
                  label="Domicilio de traslado"
                  value={showValue(resident.transfer.address)}
                />
                <DetailField
                  label="Telefono de traslado"
                  value={showValue(resident.transfer.phone)}
                />
              </div>
            </article>

            <article className={surfaceCardClassName}>
              <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                Medico de cabecera
              </span>
              <div className="mt-4 grid gap-3 text-brand-text-secondary">
                <DetailField
                  label="Historia clinica"
                  value={showValue(resident.clinicalProfile.clinicalRecordNumber)}
                />
                <DetailField
                  label="Lugar de atencion de emergencia"
                  value={showValue(
                    resident.clinicalProfile.emergencyCareLocation,
                  )}
                />
                <DetailField
                  label="Medico"
                  value={showValue(resident.clinicalProfile.primaryDoctorName)}
                />
                <DetailField
                  label="Consultorio"
                  value={showValue(
                    resident.clinicalProfile.primaryDoctorOfficeAddress,
                  )}
                />
                <DetailField
                  label="Telefono consultorio"
                  value={showValue(
                    resident.clinicalProfile.primaryDoctorOfficePhone,
                  )}
                />
              </div>
            </article>

            <article className={surfaceCardClassName}>
              <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                Psiquiatria
              </span>
              <div className="mt-4 grid gap-3 text-brand-text-secondary">
                <DetailField
                  label="Prestador"
                  value={showValue(resident.psychiatry.provider)}
                />
                <DetailField
                  label="Lugar de atencion"
                  value={showValue(resident.psychiatry.careLocation)}
                />
                <DetailField
                  label="Domicilio"
                  value={showValue(resident.psychiatry.address)}
                />
                <DetailField
                  label="Telefono"
                  value={showValue(resident.psychiatry.phone)}
                />
              </div>
            </article>
          </section>

          <section className="grid gap-[18px] min-[980px]:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <article className={surfaceCardClassName}>
              <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                Resumen clinico
              </span>
              <div className="mt-4 grid gap-3 text-brand-text-secondary min-[700px]:grid-cols-2">
                <DetailField
                  label="Alergias"
                  value={showValue(resident.clinicalProfile.allergies)}
                />
                <DetailField
                  label="Patologias"
                  value={showValue(resident.clinicalProfile.pathologies)}
                />
                <DetailField
                  label="Operaciones y antecedentes"
                  value={showValue(resident.clinicalProfile.surgeries)}
                />
                <DetailField
                  label="Fuma"
                  value={showBooleanValue(resident.clinicalProfile.smokes)}
                />
                <DetailField
                  label="Bebe alcohol"
                  value={showBooleanValue(
                    resident.clinicalProfile.drinksAlcohol,
                  )}
                />
                <DetailField
                  label="Peso del mes"
                  value={showWeight(resident.clinicalProfile.currentWeightKg)}
                />
              </div>
            </article>

            <article className={surfaceCardClassName}>
              <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                Pertenencias
              </span>
              <div className="mt-4 grid gap-3 text-brand-text-secondary">
                <DetailField
                  label="Anteojos"
                  value={showBooleanValue(resident.belongings.glasses)}
                />
                <DetailField
                  label="Dentaduras"
                  value={showBooleanValue(resident.belongings.dentures)}
                />
                <DetailField
                  label="Andador"
                  value={showBooleanValue(resident.belongings.walker)}
                />
                <DetailField
                  label="Cama ortopedica"
                  value={showBooleanValue(resident.belongings.orthopedicBed)}
                />
                <DetailField
                  label="Notas"
                  value={showValue(resident.belongings.notes)}
                />
              </div>
            </article>
          </section>

          <section className={surfaceCardClassName}>
            <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
              Familiares y contactos
            </span>

            {resident.familyContacts.length === 0 ? (
              <p className="mt-4 leading-[1.65] text-brand-text-secondary">
                No hay familiares o contactos cargados para este residente.
              </p>
            ) : (
              <div className="mt-4 grid gap-3 min-[980px]:grid-cols-2">
                {resident.familyContacts.map((contact) => (
                  <article
                    key={contact.id}
                    className="rounded-[22px] bg-brand-neutral px-4 py-4 text-brand-text-secondary"
                  >
                    <strong className="block text-brand-text">
                      {contact.fullName}
                    </strong>
                    <span className="mt-1 block">{contact.relationship}</span>
                    <span className="mt-1 block">{contact.phone}</span>
                    <span className="mt-1 block">{showValue(contact.email)}</span>
                    <span className="mt-1 block">{showValue(contact.address)}</span>
                    <span className="mt-1 block">{showValue(contact.notes)}</span>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="grid gap-[18px] min-[980px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <article className={surfaceCardClassName}>
              <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                Historial medico
              </span>

              {resident.medicalHistory.length === 0 ? (
                <p className="mt-4 leading-[1.65] text-brand-text-secondary">
                  No hay antecedentes medicos cargados todavia.
                </p>
              ) : (
                <div className="mt-4 grid gap-3">
                  {resident.medicalHistory.map((entry) => (
                    <article
                      key={entry.id}
                      className="rounded-[22px] bg-brand-neutral px-4 py-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="text-brand-text">{entry.title}</strong>
                        <span className="text-[0.9rem] text-brand-text-secondary">
                          {formatDate(entry.recordedAt)}
                        </span>
                      </div>
                      <p className="mt-2 leading-[1.6] text-brand-text-secondary">
                        {entry.notes}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </article>

            <article className={surfaceCardClassName}>
              <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                Domicilio registrado
              </span>
              <div className="mt-4 grid gap-3 text-brand-text-secondary">
                <DetailField
                  label="Domicilio"
                  value={showValue(resident.address.street)}
                />
                <DetailField
                  label="Ciudad"
                  value={showValue(resident.address.city)}
                />
                <DetailField
                  label="Provincia"
                  value={showValue(resident.address.state)}
                />
                <DetailField
                  label="Codigo postal"
                  value={showValue(resident.address.postalCode)}
                />
                <DetailField
                  label="Habitacion interna"
                  value={showValue(resident.address.room ?? resident.room)}
                />
              </div>
            </article>
          </section>

          <section className="grid gap-[18px] min-[980px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <article className={surfaceCardClassName}>
              <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                Adjuntos clinicos
              </span>

              {resident.attachments.length === 0 ? (
                <p className="mt-4 leading-[1.65] text-brand-text-secondary">
                  No hay imagenes ni PDFs cargados para este residente.
                </p>
              ) : (
                <div className="mt-4 grid gap-3">
                  {resident.attachments.map((attachment) => (
                    <article
                      key={attachment.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] bg-brand-neutral px-4 py-4"
                    >
                      <div className="grid gap-1">
                        <strong className="text-brand-text">
                          {attachment.fileName}
                        </strong>
                        <span className="text-brand-text-secondary">
                          {formatResidentAttachmentKind(attachment.kind)} |{' '}
                          {formatAttachmentSize(attachment.sizeBytes)}
                        </span>
                        <span className="text-[0.9rem] text-brand-text-secondary">
                          Cargado el {formatDate(attachment.uploadedAt)}
                        </span>
                      </div>
                      <a
                        className={secondaryButtonClassName}
                        href={attachment.dataUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Abrir archivo
                      </a>
                    </article>
                  ))}
                </div>
              )}
            </article>

            <article className={surfaceCardClassName}>
              <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                Auditoria
              </span>
              <div className="mt-4 grid gap-3 text-brand-text-secondary">
                <div>
                  <strong className="block text-brand-text">Creado por</strong>
                  <span>{resident.audit.createdBy}</span>
                  <span className="mt-1 block">
                    {formatDate(resident.audit.createdAt)}
                  </span>
                </div>
                <div>
                  <strong className="block text-brand-text">
                    Ultima actualizacion
                  </strong>
                  <span>{resident.audit.updatedBy}</span>
                  <span className="mt-1 block">
                    {formatDate(resident.audit.updatedAt)}
                  </span>
                </div>
              </div>
            </article>
          </section>
        </>
      )}
    </WorkspaceShell>
  );
}
