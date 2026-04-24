import { useEffect, useMemo, useState } from 'react';

import type {
  AuthSession,
  TeamMemberOverview,
  UserSchedule,
  UserScheduleCreateInput,
  UserScheduleUpdateInput,
} from '@gentrix/shared-types';

import {
  formatEntityStatus,
  formatJobTitleLabel,
  formatShiftLabel,
} from '../../../shared/lib/display-labels';
import {
  badgeBaseClassName,
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  shellCardClassName,
  surfaceCardClassName,
} from '../../../shared/ui/class-names';
import { SelectField } from '../../../shared/ui/select-field';
import { WorkspaceShell } from '../../dashboard/ui/workspace-shell';
import { StatusNotice } from '../../dashboard/ui/status-notice';
import type { DashboardScreenState } from '../../dashboard/types/dashboard-screen-state';

interface StaffSchedulesWorkspaceProps {
  screenState: DashboardScreenState;
  session: AuthSession;
  residentCount: number;
  team: TeamMemberOverview[];
  selectedUserId: string | null;
  schedules: UserSchedule[];
  teamError: string | null;
  isLoadingSchedules: boolean;
  isSavingSchedule: boolean;
  scheduleNotice: string | null;
  scheduleNoticeTone: 'success' | 'error';
  canManageSchedules: boolean;
  onSelectUser: (userId: string) => Promise<void>;
  onScheduleCreate: (
    input: UserScheduleCreateInput,
  ) => Promise<UserSchedule | null>;
  onScheduleUpdate: (
    scheduleId: string,
    input: UserScheduleUpdateInput,
  ) => Promise<UserSchedule | null>;
  onLogout: () => void | Promise<void>;
  onRetry: () => void | Promise<void>;
}

interface ScheduleFormState {
  weekday: string;
  startTime: string;
  endTime: string;
  exceptionDate: string;
  coverageNote: string;
}

const weekdayOptions = [
  { value: '1', label: 'Lunes' },
  { value: '2', label: 'Martes' },
  { value: '3', label: 'Miercoles' },
  { value: '4', label: 'Jueves' },
  { value: '5', label: 'Viernes' },
  { value: '6', label: 'Sabado' },
  { value: '7', label: 'Domingo' },
] as const;

function createInitialScheduleFormState(): ScheduleFormState {
  return {
    weekday: '1',
    startTime: '07:00',
    endTime: '15:00',
    exceptionDate: '',
    coverageNote: '',
  };
}

function toScheduleFormState(schedule: UserSchedule): ScheduleFormState {
  return {
    weekday: String(schedule.weekday),
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    exceptionDate: toDateInputValue(schedule.exceptionDate),
    coverageNote: schedule.coverageNote ?? '',
  };
}

function toDateInputValue(value: string | undefined): string {
  return value ? value.slice(0, 10) : '';
}

function toExceptionDateIso(value: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const [yearToken, monthToken, dayToken] = value.split('-');
  const year = Number.parseInt(yearToken ?? '', 10);
  const month = Number.parseInt(monthToken ?? '', 10);
  const day = Number.parseInt(dayToken ?? '', 10);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return undefined;
  }

  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0)).toISOString();
}

function formatWeekdayLabel(weekday: number): string {
  return (
    weekdayOptions.find((option) => Number(option.value) === weekday)?.label ??
    `Día ${weekday}`
  );
}

export function StaffSchedulesWorkspace({
  screenState,
  session,
  residentCount,
  team,
  selectedUserId,
  schedules,
  teamError,
  isLoadingSchedules,
  isSavingSchedule,
  scheduleNotice,
  scheduleNoticeTone,
  canManageSchedules,
  onSelectUser,
  onScheduleCreate,
  onScheduleUpdate,
  onLogout,
  onRetry,
}: StaffSchedulesWorkspaceProps) {
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(
    null,
  );
  const [formState, setFormState] = useState<ScheduleFormState>(
    createInitialScheduleFormState,
  );
  const [formError, setFormError] = useState<string | null>(null);

  const selectedMember = useMemo(
    () => team.find((member) => member.id === selectedUserId) ?? null,
    [selectedUserId, team],
  );

  useEffect(() => {
    setEditingScheduleId(null);
    setFormState(createInitialScheduleFormState());
    setFormError(null);
  }, [selectedUserId]);

  async function handleSubmit(): Promise<void> {
    if (!selectedMember) {
      setFormError('Seleccione un miembro del equipo para continuar.');
      return;
    }

    const weekday = Number.parseInt(formState.weekday, 10);
    const exceptionDate = toExceptionDateIso(formState.exceptionDate);

    if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) {
      setFormError('Seleccione un día válido para el horario.');
      return;
    }

    if (!formState.startTime || !formState.endTime) {
      setFormError('Defina la hora de inicio y fin del horario.');
      return;
    }

    if (!exceptionDate && formState.exceptionDate) {
      setFormError('La fecha puntual no es válida.');
      return;
    }

    if (formState.startTime >= formState.endTime) {
      setFormError('La hora de inicio debe ser anterior a la hora de fin.');
      return;
    }

    setFormError(null);

    const payload = {
      weekday,
      startTime: formState.startTime,
      endTime: formState.endTime,
      exceptionDate,
      coverageNote: formState.coverageNote.trim() || undefined,
    };

    const savedSchedule = editingScheduleId
      ? await onScheduleUpdate(editingScheduleId, payload)
      : await onScheduleCreate(payload);

    if (!savedSchedule) {
      return;
    }

    setEditingScheduleId(null);
    setFormState(createInitialScheduleFormState());
  }

  return (
    <WorkspaceShell
      residentCount={residentCount}
      session={session}
      onLogout={onLogout}
    >
      <section
        className={`${shellCardClassName} grid gap-5 px-7 py-6`}
        data-testid="staff-schedules-workspace"
      >
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="grid gap-2.5">
            <span className="inline-flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-primary">
              Personal
            </span>
            <h1 className="text-[clamp(2rem,3.2vw,2.6rem)] font-bold tracking-[-0.04em] text-brand-text">
              Cobertura y horarios del equipo
            </h1>
            <p className="max-w-[60ch] leading-[1.65] text-brand-text-secondary">
              {canManageSchedules
                ? 'Seleccione un miembro del equipo, revisa sus guardias semanales y agrega coberturas puntuales desde un solo workspace.'
                : 'Consulte la cobertura del equipo y revise guardias semanales sin modificar horarios globales.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className={primaryButtonClassName}>
              {team.length} perfiles
            </span>
            <span className={primaryButtonClassName}>
              {schedules.length} horarios
            </span>
            {!canManageSchedules && (
              <span className={primaryButtonClassName}>Solo lectura</span>
            )}
          </div>
        </div>
      </section>

      {(scheduleNotice || formError) && (
        <section
          className={`${shellCardClassName} px-6 py-[22px] ${
            formError || scheduleNoticeTone === 'error'
              ? 'border border-[rgba(168,43,17,0.16)] bg-[rgba(168,43,17,0.08)] text-[rgb(130,44,25)]'
              : 'border border-[rgba(0,102,132,0.14)] bg-[rgba(0,102,132,0.08)] text-brand-secondary'
          }`}
        >
          <span className="leading-[1.55]">{formError ?? scheduleNotice}</span>
        </section>
      )}

      {screenState === 'loading' && (
        <StatusNotice message="Cargando personal y horarios desde la sesión activa." />
      )}

      {screenState === 'error' && (
        <StatusNotice
          title="No se pudo cargar la cobertura del equipo."
          message={teamError ?? 'Ocurrió un error inesperado.'}
          actions={[
            {
              label: 'Reintentar',
              onClick: onRetry,
            },
            {
              label: 'Cerrar sesión',
              onClick: onLogout,
              variant: 'secondary',
            },
          ]}
        />
      )}

      {screenState === 'ready' && (
        <section className="grid gap-[18px] min-[1181px]:grid-cols-[minmax(300px,0.72fr)_minmax(0,1.28fr)]">
          <article className={surfaceCardClassName}>
            <div className="mb-[18px] flex items-center justify-between gap-3">
              <div>
                <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                  Equipo disponible
                </span>
                <h2 className="mt-1 text-[1.25rem] font-bold tracking-[-0.04em] text-brand-text">
                  Personal cargado en Prisma
                </h2>
              </div>
              <span
                className={`${badgeBaseClassName} bg-brand-primary/12 text-brand-primary`}
              >
                {team.length} activos
              </span>
            </div>

            <div className="grid gap-3">
              {team.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-[rgba(0,102,132,0.22)] bg-brand-neutral px-4 py-5 text-brand-text-secondary">
                  No hay personal cargado todavia.
                </div>
              ) : (
                team.map((member) => {
                  const isSelected = member.id === selectedUserId;

                  return (
                    <button
                      key={member.id}
                      data-testid={`staff-member-${member.id}`}
                      className={`grid gap-2 rounded-[22px] border px-4 py-4 text-left transition ${
                        isSelected
                          ? 'border-[rgba(0,102,132,0.26)] bg-brand-primary/8 shadow-[0_18px_40px_rgba(0,102,132,0.08)]'
                          : 'border-[rgba(0,102,132,0.08)] bg-brand-neutral hover:border-[rgba(0,102,132,0.16)] hover:bg-white'
                      }`}
                      type="button"
                      onClick={() => {
                        void onSelectUser(member.id);
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <strong className="text-brand-text">
                          {member.fullName}
                        </strong>
                        <span
                          className={`${badgeBaseClassName} ${
                            isSelected
                              ? 'bg-brand-primary/14 text-brand-primary'
                              : 'bg-brand-secondary/12 text-brand-secondary'
                          }`}
                        >
                          {member.shift ? formatShiftLabel(member.shift) : '—'}
                        </span>
                      </div>
                      <span className="text-brand-text-secondary">
                        {member.jobTitleLabel ??
                          formatJobTitleLabel(member.jobTitleCode ?? '')}{' '}
                        / {member.wardName ?? '—'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </article>

          <div className="grid gap-[18px]">
            <article className={surfaceCardClassName}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="grid gap-1.5">
                  <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                    Miembro seleccionado
                  </span>
                  <h2 className="text-[1.2rem] font-bold tracking-[-0.04em] text-brand-text">
                    {selectedMember?.fullName ?? 'Seleccione un miembro del equipo'}
                  </h2>
                </div>
                {selectedMember && (
                  <span
                    className={`${badgeBaseClassName} bg-brand-primary/12 text-brand-primary`}
                  >
                    {formatEntityStatus(selectedMember.status)}
                  </span>
                )}
              </div>

              {selectedMember ? (
                <div className="mt-4 grid gap-3 text-brand-text-secondary min-[900px]:grid-cols-3">
                  <article className="rounded-[22px] bg-brand-neutral px-4 py-4">
                    <span className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
                      Rol
                    </span>
                    <strong className="mt-2 block text-brand-text">
                      {selectedMember.jobTitleLabel ??
                        formatJobTitleLabel(selectedMember.jobTitleCode ?? '')}
                    </strong>
                  </article>
                  <article className="rounded-[22px] bg-brand-neutral px-4 py-4">
                    <span className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
                      Sector
                    </span>
                    <strong className="mt-2 block text-brand-text">
                      {selectedMember.wardName ?? '—'}
                    </strong>
                  </article>
                  <article className="rounded-[22px] bg-brand-neutral px-4 py-4">
                    <span className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
                      Turno base
                    </span>
                    <strong className="mt-2 block text-brand-text">
                      {selectedMember.shift
                        ? formatShiftLabel(selectedMember.shift)
                        : '—'}
                    </strong>
                  </article>
                </div>
              ) : (
                <p className="mt-4 leading-[1.65] text-brand-text-secondary">
                  Elige un perfil del panel izquierdo para revisar o editar sus
                  horarios.
                </p>
              )}
            </article>

            <article className={surfaceCardClassName}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="grid gap-1.5">
                  <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                    Editor de horarios
                  </span>
                  <h2 className="text-[1.2rem] font-bold tracking-[-0.04em] text-brand-text">
                    {canManageSchedules
                      ? editingScheduleId
                        ? 'Editar horario'
                        : 'Nuevo horario'
                      : 'Vista de horarios'}
                  </h2>
                </div>
                {canManageSchedules ? (
                  <button
                    data-testid="staff-schedule-reset-button"
                    className={secondaryButtonClassName}
                    type="button"
                    onClick={() => {
                      setEditingScheduleId(null);
                      setFormState(createInitialScheduleFormState());
                      setFormError(null);
                    }}
                  >
                    Nuevo horario
                  </button>
                ) : null}
              </div>

              {!canManageSchedules && (
                <p className="mt-4 leading-[1.6] text-brand-text-secondary">
                  El personal puede revisar la cobertura del equipo, pero la
                  carga y edición de horarios queda reservada a administración y
                  coordinación.
                </p>
              )}

              <div className="mt-4 grid gap-[14px] min-[980px]:grid-cols-[220px_160px_160px]">
                <label className="grid gap-2.5">
                  <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                    Día semanal
                  </span>
                  <SelectField
                    name="schedule.weekday"
                    testId="staff-schedule-weekday-select"
                    value={formState.weekday}
                    options={weekdayOptions}
                    disabled={!canManageSchedules}
                    onChange={(nextValue) => {
                      setFormState((current) => ({
                        ...current,
                        weekday: nextValue,
                      }));
                    }}
                  />
                </label>

                <label className="grid gap-2.5">
                  <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                    Desde
                  </span>
                  <input
                    data-testid="staff-schedule-start-time-input"
                    className={inputClassName}
                    type="time"
                    disabled={!canManageSchedules}
                    value={formState.startTime}
                    onChange={(event) => {
                      setFormState((current) => ({
                        ...current,
                        startTime: event.target.value,
                      }));
                    }}
                  />
                </label>

                <label className="grid gap-2.5">
                  <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                    Hasta
                  </span>
                  <input
                    data-testid="staff-schedule-end-time-input"
                    className={inputClassName}
                    type="time"
                    disabled={!canManageSchedules}
                    value={formState.endTime}
                    onChange={(event) => {
                      setFormState((current) => ({
                        ...current,
                        endTime: event.target.value,
                      }));
                    }}
                  />
                </label>
              </div>

              <div className="mt-[14px] grid gap-[14px] min-[980px]:grid-cols-[220px_minmax(0,1fr)]">
                <label className="grid gap-2.5">
                  <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                    Fecha puntual
                  </span>
                  <input
                    data-testid="staff-schedule-date-input"
                    className={inputClassName}
                    type="date"
                    disabled={!canManageSchedules}
                    value={formState.exceptionDate}
                    onChange={(event) => {
                      setFormState((current) => ({
                        ...current,
                        exceptionDate: event.target.value,
                      }));
                    }}
                  />
                </label>

                <label className="grid gap-2.5">
                  <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                    Nota de cobertura
                  </span>
                  <input
                    data-testid="staff-schedule-note-input"
                    className={inputClassName}
                    type="text"
                    disabled={!canManageSchedules}
                    value={formState.coverageNote}
                    onChange={(event) => {
                      setFormState((current) => ({
                        ...current,
                        coverageNote: event.target.value,
                      }));
                    }}
                  />
                </label>
              </div>

              {canManageSchedules && (
                <div className="mt-5 flex flex-wrap justify-end gap-3">
                  <button
                    data-testid="staff-schedule-submit-button"
                    className={primaryButtonClassName}
                    type="button"
                    disabled={!selectedMember || isSavingSchedule}
                    onClick={() => {
                      void handleSubmit();
                    }}
                  >
                    {isSavingSchedule
                      ? 'Guardando...'
                      : editingScheduleId
                        ? 'Actualizar horario'
                        : 'Guardar horario'}
                  </button>
                </div>
              )}
            </article>

            <article className={surfaceCardClassName}>
              <div className="mb-[18px] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                    Horarios cargados
                  </span>
                  <h2 className="mt-1 text-[1.2rem] font-bold tracking-[-0.04em] text-brand-text">
                    Guardias semanales y coberturas puntuales
                  </h2>
                </div>
                {isLoadingSchedules && (
                  <span className="text-[0.9rem] text-brand-text-secondary">
                    Cargando horarios...
                  </span>
                )}
              </div>

              {selectedMember == null ? (
                <p className="leading-[1.65] text-brand-text-secondary">
                  Seleccione un perfil para ver sus horarios.
                </p>
              ) : schedules.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-[rgba(0,102,132,0.22)] bg-brand-neutral px-4 py-5 text-brand-text-secondary">
                  Este miembro del equipo todavía no tiene horarios cargados.
                </div>
              ) : (
                <div className="grid gap-3">
                  {schedules.map((schedule) => {
                    const isEditing = schedule.id === editingScheduleId;

                    return (
                      <article
                        key={schedule.id}
                        data-testid={`staff-schedule-${schedule.id}`}
                        className={`rounded-[22px] border px-4 py-4 transition ${
                          isEditing
                            ? 'border-[rgba(0,102,132,0.26)] bg-brand-primary/8'
                            : 'border-[rgba(0,102,132,0.08)] bg-brand-neutral'
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="grid gap-2">
                            <span
                              className={`${badgeBaseClassName} w-fit ${
                                schedule.exceptionDate
                                  ? 'bg-brand-secondary/12 text-brand-secondary'
                                  : 'bg-brand-primary/12 text-brand-primary'
                              }`}
                            >
                              {schedule.exceptionDate
                                ? 'Cobertura puntual'
                                : 'Guardia semanal'}
                            </span>
                            <strong className="text-brand-text">
                              {formatWeekdayLabel(schedule.weekday)} ·{' '}
                              {schedule.startTime} - {schedule.endTime}
                            </strong>
                          </div>

                          {canManageSchedules ? (
                            <button
                              data-testid={`staff-schedule-edit-${schedule.id}`}
                              className={secondaryButtonClassName}
                              type="button"
                              onClick={() => {
                                setEditingScheduleId(schedule.id);
                                setFormState(toScheduleFormState(schedule));
                                setFormError(null);
                              }}
                            >
                              Editar
                            </button>
                          ) : null}
                        </div>

                        {schedule.exceptionDate && (
                          <p className="mt-3 text-brand-text-secondary">
                            Fecha puntual:{' '}
                            {toDateInputValue(schedule.exceptionDate)}
                          </p>
                        )}

                        <p className="mt-2 leading-[1.65] text-brand-text-secondary">
                          {schedule.coverageNote?.trim()
                            ? schedule.coverageNote
                            : 'Sin nota de cobertura.'}
                        </p>
                      </article>
                    );
                  })}
                </div>
              )}
            </article>
          </div>
        </section>
      )}
    </WorkspaceShell>
  );
}
