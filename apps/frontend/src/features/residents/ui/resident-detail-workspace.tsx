import { Link, useNavigate } from 'react-router-dom';

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
          <span className="inline-flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-primary">
            Residentes
          </span>
          <h1 className="text-[clamp(2rem,3.2vw,2.6rem)] font-bold tracking-[-0.04em] text-brand-text">
            {resident?.fullName ?? 'Detalle del residente'}
          </h1>
          <p className="max-w-[58ch] leading-[1.65] text-brand-text-secondary">
            Consulta la ficha actual del paciente y el estado general de sus
            datos registrados en el sistema.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link className={secondaryButtonClassName} to="/residentes">
            Volver a residentes
          </Link>
          <button
            className={`${primaryButtonClassName} cursor-not-allowed opacity-70`}
            type="button"
            disabled
            title="La edicion del residente se habilitara en la proxima iteracion."
          >
            Editar paciente
          </button>
        </div>
      </section>

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
              onClick: () => navigate('/residentes'),
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
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[1.65rem] font-bold tracking-[-0.04em] text-brand-text">
                  {resident.fullName}
                </span>
                <span
                  className={`${badgeBaseClassName} bg-brand-primary/12 text-brand-primary`}
                >
                  {formatEntityStatus(resident.status)}
                </span>
              </div>
              <p className="max-w-[64ch] leading-[1.7] text-brand-text-secondary">
                Habitacion {resident.room}, {resident.age} anos, nivel de
                cuidado {formatResidentCareLevel(resident.careLevel).toLowerCase()}.
              </p>
              <div className="grid gap-3 min-[680px]:grid-cols-3">
                <article className="rounded-[22px] bg-brand-neutral px-4 py-4">
                  <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
                    Ingreso
                  </span>
                  <strong className="mt-2 block text-brand-text">
                    {formatDate(resident.admissionDate)}
                  </strong>
                </article>
                <article className="rounded-[22px] bg-brand-neutral px-4 py-4">
                  <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
                    Nacimiento
                  </span>
                  <strong className="mt-2 block text-brand-text">
                    {formatDate(resident.birthDate)}
                  </strong>
                </article>
                <article className="rounded-[22px] bg-brand-neutral px-4 py-4">
                  <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
                    Edad
                  </span>
                  <strong className="mt-2 block text-brand-text">
                    {resident.age} anos
                  </strong>
                </article>
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
                Identidad legal
              </span>
              <div className="mt-4 grid gap-3 text-brand-text-secondary">
                <div>
                  <strong className="block text-brand-text">Documento</strong>
                  <span>
                    {formatResidentDocumentType(resident.documentType)}{' '}
                    {resident.documentNumber}
                  </span>
                </div>
                <div>
                  <strong className="block text-brand-text">Pais emisor</strong>
                  <span>{resident.documentIssuingCountry}</span>
                </div>
                <div>
                  <strong className="block text-brand-text">Sexo</strong>
                  <span>{formatResidentSex(resident.sex)}</span>
                </div>
                <div>
                  <strong className="block text-brand-text">
                    Correo electronico
                  </strong>
                  <span>{showValue(resident.email)}</span>
                </div>
              </div>
            </article>

            <article className={surfaceCardClassName}>
              <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                Nombre completo
              </span>
              <div className="mt-4 grid gap-3 text-brand-text-secondary">
                <div>
                  <strong className="block text-brand-text">Nombre</strong>
                  <span>{resident.firstName}</span>
                </div>
                <div>
                  <strong className="block text-brand-text">Otros nombres</strong>
                  <span>{showValue(resident.middleNames)}</span>
                </div>
                <div>
                  <strong className="block text-brand-text">Apellido</strong>
                  <span>{resident.lastName}</span>
                </div>
                <div>
                  <strong className="block text-brand-text">Otros apellidos</strong>
                  <span>{showValue(resident.otherLastNames)}</span>
                </div>
              </div>
            </article>

            <article className={surfaceCardClassName}>
              <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                Domicilio registrado
              </span>
              <div className="mt-4 grid gap-2 text-brand-text-secondary">
                <span>{resident.address.street}</span>
                <span>
                  {resident.address.city}, {resident.address.state}
                </span>
                <span>CP {resident.address.postalCode}</span>
                <span>
                  Habitacion interna {resident.address.room ?? resident.room}
                </span>
              </div>
            </article>
          </section>

          <section className="grid gap-[18px] min-[980px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <article className={surfaceCardClassName}>
              <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                Datos residenciales
              </span>
              <div className="mt-4 grid gap-3 text-brand-text-secondary">
                <div>
                  <strong className="block text-brand-text">Habitacion</strong>
                  <span>{resident.room}</span>
                </div>
                <div>
                  <strong className="block text-brand-text">
                    Nivel de cuidado
                  </strong>
                  <span>{formatResidentCareLevel(resident.careLevel)}</span>
                </div>
                <div>
                  <strong className="block text-brand-text">Estado</strong>
                  <span>{formatEntityStatus(resident.status)}</span>
                </div>
              </div>
            </article>

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
