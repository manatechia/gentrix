import { useCallback, useEffect, useState } from 'react';

import type {
  StaffOverview,
  StaffSchedule,
  StaffScheduleCreateInput,
  StaffScheduleUpdateInput,
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
  const [staff, setStaff] = useState<StaffOverview[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [scheduleNotice, setScheduleNotice] = useState<string | null>(null);
  const [scheduleNoticeTone, setScheduleNoticeTone] = useState<
    'success' | 'error'
  >('success');

  const loadStaffWorkspace = useCallback(async (): Promise<void> => {
    if (!token) {
      setStaff([]);
      setSelectedStaffId(null);
      setSchedules([]);
      setStaffError(null);
      setScreenState('loading');
      return;
    }

    setScreenState('loading');
    setStaffError(null);

    try {
      const staffPayload = await staffService.getStaff();
      const nextStaff = unwrapEnvelope(staffPayload);
      const nextSelectedStaffId =
        nextStaff.find((member) => member.id === selectedStaffId)?.id ??
        nextStaff[0]?.id ??
        null;

      setStaff(nextStaff);
      setSelectedStaffId(nextSelectedStaffId);

      if (!nextSelectedStaffId) {
        setSchedules([]);
        setScreenState('ready');
        return;
      }

      const schedulesPayload =
        await staffService.getStaffSchedules(nextSelectedStaffId);
      setSchedules(sortSchedules(unwrapEnvelope(schedulesPayload)));
      setScreenState('ready');
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'No pude cargar el personal y sus horarios.',
      );

      if (message === 'Unauthorized.') {
        await logout();
        return;
      }

      setStaff([]);
      setSelectedStaffId(null);
      setSchedules([]);
      setStaffError(message);
      setScreenState('error');
    }
  }, [logout, selectedStaffId, token]);

  const handleSelectStaff = useCallback(
    async (staffId: string): Promise<void> => {
      if (staffId === selectedStaffId) {
        return;
      }

      if (!token) {
        await logout();
        return;
      }

      setSelectedStaffId(staffId);
      setIsLoadingSchedules(true);
      setScheduleNotice(null);

      try {
        const payload = await staffService.getStaffSchedules(staffId);
        setSchedules(sortSchedules(unwrapEnvelope(payload)));
      } catch (error) {
        const message = getApiErrorMessage(
          error,
          'No pude cargar los horarios del personal seleccionado.',
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
    [logout, selectedStaffId, token],
  );

  const handleScheduleCreate = useCallback(
    async (
      input: StaffScheduleCreateInput,
    ): Promise<StaffSchedule | null> => {
      if (!selectedStaffId) {
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
        const payload = await staffService.createStaffSchedule(
          selectedStaffId,
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
    [logout, selectedStaffId, token],
  );

  const handleScheduleUpdate = useCallback(
    async (
      scheduleId: string,
      input: StaffScheduleUpdateInput,
    ): Promise<StaffSchedule | null> => {
      if (!token) {
        await logout();
        return null;
      }

      setIsSavingSchedule(true);
      setScheduleNotice(null);

      try {
        const payload = await staffService.updateStaffSchedule(scheduleId, input);
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
      setStaff([]);
      setSelectedStaffId(null);
      setSchedules([]);
      setStaffError(null);
      setScreenState('loading');
      return;
    }

    void loadStaffWorkspace();
  }, [loadStaffWorkspace, status, token]);

  return {
    screenState,
    staff,
    selectedStaffId,
    schedules,
    staffError,
    isLoadingSchedules,
    isSavingSchedule,
    scheduleNotice,
    scheduleNoticeTone,
    handleRetry: loadStaffWorkspace,
    handleSelectStaff,
    handleScheduleCreate,
    handleScheduleUpdate,
  };
}

function sortSchedules(items: StaffSchedule[]): StaffSchedule[] {
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
