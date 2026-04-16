import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import type {
  AuthSession,
  ResidentAgendaEventCreateInput,
  ResidentAgendaEventUpdateInput,
  ResidentAgendaOccurrence,
  ResidentAgendaOccurrenceOverrideInput,
  ResidentAgendaSeriesCreateInput,
  ResidentAgendaSeriesUpdateInput,
  ResidentCareStatus,
  ResidentDetail,
  ResidentGeriatricAssessmentLevel,
  ResidentLiveProfile,
  ResidentObservationNote,
  ResidentObservationNoteCreateInput,
  ResidentObservationNoteCreateResponse,
} from '@gentrix/shared-types';

import {
  canManageResidents,
  canViewResidentAdministrativeData,
} from '../../../shared/lib/authz';
import {
  formatEntityStatus,
  formatResidentCareLevel,
  formatResidentCareStatus,
  formatResidentDocumentType,
  formatResidentGeriatricAssessmentLevel,
  formatResidentSex,
} from '../../../shared/lib/display-labels';
import {
  badgeBaseClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  shellCardClassName,
  surfaceCardClassName,
} from '../../../shared/ui/class-names';
import { CollapsibleDetailSection } from '../../../shared/ui/collapsible-detail-section';
import { PageToolbar } from '../../../shared/ui/page-toolbar';
import { WorkspaceShell } from '../../dashboard/ui/workspace-shell';
import { StatusNotice } from '../../dashboard/ui/status-notice';
import type { DashboardScreenState } from '../../dashboard/types/dashboard-screen-state';
import { ResidentAgendaPanel } from './resident-agenda-panel';
import { ResidentLiveProfilePanel } from './resident-live-profile-panel';
import { ResidentObservationsPanel } from './resident-observations-panel';

/**
 * Filtra las notas de observación para mostrar únicamente las que pertenecen
 * al "episodio" de observación actual. Si el residente no está en observación,
 * devolvemos una lista vacía: las notas siguen persistidas en el backend y
 * se expondrán más adelante desde una vista de historial. Si está en
 * observación, mostramos sólo las creadas desde que entró al estado.
 */
function filterCurrentObservationNotes(
  notes: ResidentObservationNote[],
  resident: ResidentDetail,
): ResidentObservationNote[] {
  if (resident.careStatus !== 'en_observacion') {
    return [];
  }
  const sinceIso = resident.careStatusChangedAt;
  if (!sinceIso) {
    return notes;
  }
  const since = new Date(sinceIso).getTime();
  if (Number.isNaN(since)) {
    return notes;
  }
  return notes.filter((note) => {
    const createdAt = new Date(note.audit.createdAt).getTime();
    return !Number.isNaN(createdAt) && createdAt >= since;
  });
}

interface ResidentDetailWorkspaceProps {
  screenState: DashboardScreenState;
  session: AuthSession;
  residentCount: number;
  resident: ResidentDetail | null;
  residentLiveProfile: ResidentLiveProfile | null;
  residentError: string | null;
  onLogout: () => void | Promise<void>;
  onRetry: () => void | Promise<void>;
  isUpdatingCareStatus: boolean;
  careStatusNotice: string | null;
  careStatusNoticeTone: 'success' | 'error';
  onCareStatusChange: (toStatus: ResidentCareStatus) => Promise<boolean>;
  agendaOccurrences: ResidentAgendaOccurrence[];
  isSavingAgendaEvent: boolean;
  activeAgendaMutationId: string | null;
  agendaNotice: string | null;
  agendaNoticeTone: 'success' | 'error';
  onAgendaEventCreate: (input: ResidentAgendaEventCreateInput) => Promise<unknown>;
  onAgendaEventUpdate: (
    eventId: string,
    input: ResidentAgendaEventUpdateInput,
  ) => Promise<unknown>;
  onAgendaEventDelete: (eventId: string) => Promise<boolean>;
  onAgendaSeriesCreate: (input: ResidentAgendaSeriesCreateInput) => Promise<unknown>;
  onAgendaSeriesUpdate: (
    seriesId: string,
    input: ResidentAgendaSeriesUpdateInput,
  ) => Promise<unknown>;
  onAgendaSeriesDelete: (seriesId: string) => Promise<boolean>;
  onAgendaOccurrenceSkip: (seriesId: string, occurrenceDate: string) => Promise<boolean>;
  onAgendaOccurrenceOverride: (
    seriesId: string,
    occurrenceDate: string,
    input: ResidentAgendaOccurrenceOverrideInput,
  ) => Promise<boolean>;
  observationNotes: ResidentObservationNote[];
  isSavingObservationNote: boolean;
  activeObservationMutationId: string | null;
  observationNotice: string | null;
  observationNoticeTone: 'success' | 'error';
  onObservationNoteCreate: (
    input: ResidentObservationNoteCreateInput,
  ) => Promise<ResidentObservationNoteCreateResponse | null>;
  onObservationNoteDelete: (noteId: string) => Promise<boolean>;
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

function showGeriatricAssessmentValue(
  value: ResidentGeriatricAssessmentLevel | undefined,
): string {
  if (!value) {
    return 'No informado';
  }

  return formatResidentGeriatricAssessmentLevel(value);
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
  residentLiveProfile,
  residentError,
  onLogout,
  onRetry,
  isUpdatingCareStatus,
  careStatusNotice,
  careStatusNoticeTone,
  onCareStatusChange,
  agendaOccurrences,
  isSavingAgendaEvent,
  activeAgendaMutationId,
  agendaNotice,
  agendaNoticeTone,
  onAgendaEventCreate,
  onAgendaEventUpdate,
  onAgendaEventDelete,
  onAgendaSeriesCreate,
  onAgendaSeriesUpdate,
  onAgendaSeriesDelete,
  onAgendaOccurrenceSkip,
  onAgendaOccurrenceOverride,
  observationNotes,
  isSavingObservationNote,
  activeObservationMutationId,
  observationNotice,
  observationNoticeTone,
  onObservationNoteCreate,
  onObservationNoteDelete,
}: ResidentDetailWorkspaceProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const detailLocationState =
    (location.state as ResidentDetailLocationState | null) ?? null;
  const residentNotice = detailLocationState?.residentNotice ?? null;
  const residentNoticeTone =
    detailLocationState?.residentNoticeTone ?? 'success';
  const canManageRecords = canManageResidents(session.user.role);
  const canViewAdministrativeData = canViewResidentAdministrativeData(
    session.user.role,
  );
  const overviewChips = resident
    ? [
        resident.room ? `Hab. ${resident.room}` : null,
        `Cuidado: ${formatResidentCareLevel(resident.careLevel)}`,
      ].filter((chip): chip is string => Boolean(chip))
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

  const allergiesRaw = resident?.clinicalProfile.allergies;
  const hasAllergies = Boolean(allergiesRaw && allergiesRaw.trim());

  return (
    <WorkspaceShell
      residentCount={residentCount}
      session={session}
      onLogout={onLogout}
    >
      <PageToolbar
        section="Residentes"
        title={resident?.fullName ?? 'Detalle del residente'}
        backTitle="Volver a residentes"
        backFallbackTo="/residentes"
        actions={
          resident && canManageRecords ? (
            <Link
              data-testid="resident-edit-button"
              className={primaryButtonClassName}
              to={`/residentes/${resident.id}/editar`}
            >
              Editar paciente
            </Link>
          ) : null
        }
      />

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
          <section className={`${surfaceCardClassName} grid gap-4`}>
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`${badgeBaseClassName} w-fit bg-brand-primary/12 text-brand-primary`}
                >
                  {formatEntityStatus(resident.status)}
                </span>
                <span
                  data-testid="resident-care-status-badge"
                  className={`${badgeBaseClassName} w-fit ${
                    resident.careStatus === 'en_observacion'
                      ? 'bg-[rgba(212,140,18,0.16)] text-[rgb(150,90,10)]'
                      : 'bg-brand-neutral text-brand-text-secondary'
                  }`}
                >
                  {formatResidentCareStatus(resident.careStatus)}
                </span>
                {overviewChips.map((chip) => (
                  <span
                    key={chip}
                    className={`${badgeBaseClassName} w-fit bg-[rgba(0,102,132,0.08)] text-brand-secondary`}
                  >
                    {chip}
                  </span>
                ))}
                {resident.careStatus === 'en_observacion' && (
                  <button
                    type="button"
                    data-testid="resident-clear-observation-button"
                    className={secondaryButtonClassName}
                    disabled={isUpdatingCareStatus}
                    onClick={() => {
                      void onCareStatusChange('normal');
                    }}
                  >
                    {isUpdatingCareStatus
                      ? 'Actualizando...'
                      : 'Quitar de observacion'}
                  </button>
                )}
              </div>
              {careStatusNotice && (
                <div
                  data-testid="resident-care-status-notice"
                  className={`rounded-[18px] px-4 py-3 text-[0.92rem] leading-[1.5] ${
                    careStatusNoticeTone === 'error'
                      ? 'border border-[rgba(168,43,17,0.16)] bg-[rgba(168,43,17,0.08)] text-[rgb(130,44,25)]'
                      : 'border border-[rgba(0,102,132,0.14)] bg-[rgba(0,102,132,0.08)] text-brand-secondary'
                  }`}
                >
                  {careStatusNotice}
                </div>
              )}
            </div>

            <div
              data-testid="resident-safety-card"
              className="rounded-[22px] border border-[rgba(168,43,17,0.16)] bg-[rgba(168,43,17,0.04)] px-4 py-4"
            >
              <span className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[rgb(130,44,25)]">
                Crítico / seguridad
              </span>
              <div className="mt-3 grid gap-4 min-[680px]:grid-cols-2">
                <div>
                  <strong className="block text-brand-text">Alergias</strong>
                  <span
                    data-testid="resident-safety-allergies"
                    className={
                      hasAllergies
                        ? 'font-semibold text-[rgb(130,44,25)]'
                        : 'text-brand-text-secondary'
                    }
                  >
                    {hasAllergies
                      ? (allergiesRaw as string)
                      : 'Sin alergias registradas'}
                  </span>
                </div>
                <div>
                  <strong className="block text-brand-text">
                    Contacto de emergencia
                  </strong>
                  <div className="mt-1 text-brand-text-secondary">
                    <span className="text-brand-text">
                      {resident.emergencyContact.fullName}
                    </span>
                    <span className="text-brand-text-muted">
                      {' · '}
                      {resident.emergencyContact.relationship}
                    </span>
                    <span>
                      {' · '}
                      {resident.emergencyContact.phone}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <ResidentAgendaPanel
            occurrences={agendaOccurrences}
            isSavingEvent={isSavingAgendaEvent}
            activeMutationId={activeAgendaMutationId}
            notice={agendaNotice}
            noticeTone={agendaNoticeTone}
            onEventCreate={onAgendaEventCreate}
            onEventUpdate={onAgendaEventUpdate}
            onEventDelete={onAgendaEventDelete}
            onSeriesCreate={onAgendaSeriesCreate}
            onSeriesUpdate={onAgendaSeriesUpdate}
            onSeriesDelete={onAgendaSeriesDelete}
            onOccurrenceSkip={onAgendaOccurrenceSkip}
            onOccurrenceOverride={onAgendaOccurrenceOverride}
          />

          <ResidentObservationsPanel
            notes={filterCurrentObservationNotes(observationNotes, resident)}
            isUnderObservation={resident.careStatus === 'en_observacion'}
            isSaving={isSavingObservationNote}
            activeMutationId={activeObservationMutationId}
            notice={observationNotice}
            noticeTone={observationNoticeTone}
            onCreate={onObservationNoteCreate}
            onDelete={onObservationNoteDelete}
            onClearObservation={() => onCareStatusChange('normal')}
            isClearingObservation={isUpdatingCareStatus}
          />

          <ResidentLiveProfilePanel profile={residentLiveProfile} />

          <section className="grid gap-3">
            <h2 className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
              Más información
            </h2>

            <CollapsibleDetailSection title="Resumen clínico">
              <div className="grid gap-3 text-brand-text-secondary min-[700px]:grid-cols-2">
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
            </CollapsibleDetailSection>

            <CollapsibleDetailSection title="Médico de cabecera">
              <div className="grid gap-3 text-brand-text-secondary">
                <DetailField
                  label="Historia clinica"
                  value={showValue(
                    resident.clinicalProfile.clinicalRecordNumber,
                  )}
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
            </CollapsibleDetailSection>

            <CollapsibleDetailSection title="VGI inicial">
              <div className="grid gap-3 text-brand-text-secondary min-[700px]:grid-cols-2">
                <DetailField
                  label="Cognicion"
                  value={showGeriatricAssessmentValue(
                    resident.geriatricAssessment.cognition,
                  )}
                />
                <DetailField
                  label="Movilidad"
                  value={showGeriatricAssessmentValue(
                    resident.geriatricAssessment.mobility,
                  )}
                />
                <DetailField
                  label="Alimentacion"
                  value={showGeriatricAssessmentValue(
                    resident.geriatricAssessment.feeding,
                  )}
                />
                <DetailField
                  label="Piel"
                  value={showGeriatricAssessmentValue(
                    resident.geriatricAssessment.skinIntegrity,
                  )}
                />
                <DetailField
                  label="Dependencia"
                  value={showGeriatricAssessmentValue(
                    resident.geriatricAssessment.dependencyLevel,
                  )}
                />
                <DetailField
                  label="Animo y conducta"
                  value={showGeriatricAssessmentValue(
                    resident.geriatricAssessment.mood,
                  )}
                />
                <DetailField
                  label="Apoyos o equipamiento"
                  value={showValue(
                    resident.geriatricAssessment.supportEquipment,
                  )}
                />
                <DetailField
                  label="Notas"
                  value={showValue(resident.geriatricAssessment.notes)}
                />
              </div>
            </CollapsibleDetailSection>

            <CollapsibleDetailSection title="Pertenencias">
              <div className="grid gap-3 text-brand-text-secondary">
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
            </CollapsibleDetailSection>

            {canViewAdministrativeData && (
              <>
                <CollapsibleDetailSection title="Identificación">
                  <div className="grid gap-3 text-brand-text-secondary">
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
                </CollapsibleDetailSection>

                <CollapsibleDetailSection title="Datos personales">
                  <div className="grid gap-3 text-brand-text-secondary">
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
                </CollapsibleDetailSection>

                <CollapsibleDetailSection title="Ingreso y salida">
                  <div className="grid gap-3 text-brand-text-secondary">
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
                </CollapsibleDetailSection>

                <CollapsibleDetailSection title="Cobertura y traslados">
                  <div className="grid gap-3 text-brand-text-secondary">
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
                </CollapsibleDetailSection>

                <CollapsibleDetailSection title="Familiares y contactos">
                  {resident.familyContacts.length === 0 ? (
                    <p className="leading-[1.65] text-brand-text-secondary">
                      No hay familiares o contactos cargados para este
                      residente.
                    </p>
                  ) : (
                    <div className="grid gap-3 min-[980px]:grid-cols-2">
                      {resident.familyContacts.map((contact) => (
                        <article
                          key={contact.id}
                          className="rounded-[22px] bg-brand-neutral px-4 py-4 text-brand-text-secondary"
                        >
                          <strong className="block text-brand-text">
                            {contact.fullName}
                          </strong>
                          <span className="mt-1 block">
                            {contact.relationship}
                          </span>
                          <span className="mt-1 block">{contact.phone}</span>
                          <span className="mt-1 block">
                            {showValue(contact.email)}
                          </span>
                          <span className="mt-1 block">
                            {showValue(contact.address)}
                          </span>
                          <span className="mt-1 block">
                            {showValue(contact.notes)}
                          </span>
                        </article>
                      ))}
                    </div>
                  )}
                </CollapsibleDetailSection>
              </>
            )}
          </section>
        </>
      )}
    </WorkspaceShell>
  );
}
