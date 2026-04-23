import { useCallback, useEffect, useState } from 'react';

import type {
  TeamMemberOverview,
  UserSchedule,
  UserScheduleCreateInput,
  UserScheduleUpdateInput,
} from '@gentrix/shared-types';

import { useAuthSession } from '../../auth/hooks/use-auth-session';
import {
  getApiErrorMessage,
  unwrapEnvelope,
} from '../../../shared/lib/api-envelope';
import type { DashboardScreenState } from '../../dashboard/types/dashboard-screen-state';
import * as staffService from '../services/staff-service';

export function useStaffSchedulesRoute() {
  const { logout, status, token } = useAuthSession();
  const [screenState, setScreenState] =
    useState<DashboardScreenState>('loading');
  const [team, setTeam] = useState<TeamMemberOverview[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<UserSchedule[]>([]);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [scheduleNotice, setScheduleNotice] = useState<string | null>(null);
  const [scheduleNoticeTone, setScheduleNoticeTone] = useState<
    'success' | 'error'
  >('success');

  const loadWorkspace = useCallback(async (): Promise<void> => {
    if (!token) {
      setTeam([]);
      setSelectedUserId(null);
      setSchedules([]);
      setTeamError(null);
      setScreenState('loading');
      return;
    }

    setScreenState('loading');
    setTeamError(null);

    try {
      const teamPayload = await staffService.getTeam();
      const nextTeam = unwrapEnvelope(teamPayload);
      const nextSelectedUserId =
        nextTeam.find((member) => member.id === selectedUserId)?.id ??
        nextTeam[0]?.id ??
        null;

      setTeam(nextTeam);
      setSelectedUserId(nextSelectedUserId);

      if (!nextSelectedUserId) {
        setSchedules([]);
        setScreenState('ready');
        return;
      }

      const schedulesPayload =
        await staffService.getUserSchedules(nextSelectedUserId);
      setSchedules(sortSchedules(unwrapEnvelope(schedulesPayload)));
      setScreenState('ready');
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'No pude cargar el equipo y sus horarios.',
      );

      if (message === 'Unauthorized.') {
        await logout();
        return;
      }

      setTeam([]);
      setSelectedUserId(null);
      setSchedules([]);
      setTeamError(message);
      setScreenState('error');
    }
  }, [logout, selectedUserId, token]);

  const handleSelectUser = useCallback(
    async (userId: string): Promise<void> => {
      if (userId === selectedUserId) {
        return;
      }

      if (!token) {
        await logout();
        return;
      }

      setSelectedUserId(userId);
      setIsLoadingSchedules(true);
      setScheduleNotice(null);

      try {
        const payload = await staffService.getUserSchedules(userId);
        setSchedules(sortSchedules(unwrapEnvelope(payload)));
      } catch (error) {
        const message = getApiErrorMessage(
          error,
          'No pude cargar los horarios del miembro seleccionado.',
        );

        if (message === 'Unauthorized.') {
          await logout();
          return;
        }

        setSchedules([]);
        setScheduleNoticeTone('error');
        setScheduleNotice(message);
      } finally {
        setIsLoadingSchedules(false);
      }
    },
    [logout, selectedUserId, token],
  );

  const handleScheduleCreate = useCallback(
    async (
      input: UserScheduleCreateInput,
    ): Promise<UserSchedule | null> => {
      if (!selectedUserId) {
        setScheduleNoticeTone('error');
        setScheduleNotice('Selecciona un miembro del equipo primero.');
        return null;
      }

      if (!token) {
        await logout();
        return null;
      }

      setIsSavingSchedule(true);
      setScheduleNotice(null);

      try {
        const payload = await staffService.createUserSchedule(
          selectedUserId,
          input,
        );
        const createdSchedule = unwrapEnvelope(payload);

        setSchedules((current) => sortSchedules([...current, createdSchedule]));
        setScheduleNoticeTone('success');
        setScheduleNotice('Horario agregado correctamente.');

        return createdSchedule;
      } catch (error) {
        const message = getApiErrorMessage(
          error,
          'No pude guardar el horario.',
        );

        if (message === 'Unauthorized.') {
          await logout();
          return null;
        }

        setScheduleNoticeTone('error');
        setScheduleNotice(message);
        return null;
      } finally {
        setIsSavingSchedule(false);
      }
    },
    [logout, selectedUserId, token],
  );

  const handleScheduleUpdate = useCallback(
    async (
      scheduleId: string,
      input: UserScheduleUpdateInput,
    ): Promise<UserSchedule | null> => {
      if (!token) {
        await logout();
        return null;
      }

      setIsSavingSchedule(true);
      setScheduleNotice(null);

      try {
        const payload = await staffService.updateUserSchedule(scheduleId, input);
        const updatedSchedule = unwrapEnvelope(payload);

        setSchedules((current) =>
          sortSchedules(
            current.map((schedule) =>
              schedule.id === updatedSchedule.id ? updatedSchedule : schedule,
            ),
          ),
        );
        setScheduleNoticeTone('success');
        setScheduleNotice('Horario actualizado correctamente.');

        return updatedSchedule;
      } catch (error) {
        const message = getApiErrorMessage(
          error,
          'No pude actualizar el horario.',
        );

        if (message === 'Unauthorized.') {
          await logout();
          return null;
        }

        setScheduleNoticeTone('error');
        setScheduleNotice(message);
        return null;
      } finally {
        setIsSavingSchedule(false);
      }
    },
    [logout, token],
  );

  useEffect(() => {
    if (status !== 'authenticated' || !token) {
      setTeam([]);
      setSelectedUserId(null);
      setSchedules([]);
      setTeamError(null);
      setScreenState('loading');
      return;
    }

    void loadWorkspace();
  }, [loadWorkspace, status, token]);

  return {
    screenState,
    team,
    selectedUserId,
    schedules,
    teamError,
    isLoadingSchedules,
    isSavingSchedule,
    scheduleNotice,
    scheduleNoticeTone,
    handleRetry: loadWorkspace,
    handleSelectUser,
    handleScheduleCreate,
    handleScheduleUpdate,
  };
}

function sortSchedules(items: UserSchedule[]): UserSchedule[] {
  return [...items].sort((left, right) => {
    const leftExceptionDate = left.exceptionDate ?? '';
    const rightExceptionDate = right.exceptionDate ?? '';

    return (
      leftExceptionDate.localeCompare(rightExceptionDate) ||
      left.weekday - right.weekday ||
      left.startTime.localeCompare(right.startTime)
    );
  });
}
