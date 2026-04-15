import { useCallback, useEffect, useState } from 'react';

import type {
  PasswordResetResponse,
  UserCreateInput,
  UserOverview,
} from '@gentrix/shared-types';

import { useAuthSession } from '../../auth/hooks/use-auth-session';
import {
  getApiErrorMessage,
  unwrapEnvelope,
} from '../../../shared/lib/api-envelope';
import type { DashboardScreenState } from '../../dashboard/types/dashboard-screen-state';
import * as usersService from '../services/users-service';

export function useUsersRoute() {
  const { logout, status, token } = useAuthSession();
  const [screenState, setScreenState] =
    useState<DashboardScreenState>('loading');
  const [users, setUsers] = useState<UserOverview[]>([]);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [lastResetResult, setLastResetResult] =
    useState<PasswordResetResponse | null>(null);
  const [userNotice, setUserNotice] = useState<string | null>(null);
  const [userNoticeTone, setUserNoticeTone] = useState<'success' | 'error'>(
    'success',
  );

  const loadUsers = useCallback(async (): Promise<void> => {
    if (!token) {
      setUsers([]);
      setUsersError(null);
      setScreenState('loading');
      return;
    }

    setScreenState('loading');
    setUsersError(null);

    try {
      const payload = await usersService.getUsers();
      setUsers(sortUsers(unwrapEnvelope(payload)));
      setScreenState('ready');
    } catch (error) {
      const message = getApiErrorMessage(error, 'No pude cargar los usuarios.');

      if (message === 'Unauthorized.') {
        await logout();
        return;
      }

      setUsers([]);
      setUsersError(message);
      setScreenState('error');
    }
  }, [logout, token]);

  useEffect(() => {
    if (status !== 'authenticated' || !token) {
      setUsers([]);
      setUsersError(null);
      setScreenState('loading');
      return;
    }

    void loadUsers();
  }, [loadUsers, status, token]);

  const handleUserCreate = useCallback(
    async (input: UserCreateInput): Promise<UserOverview | null> => {
      if (!token) {
        await logout();
        return null;
      }

      setIsSavingUser(true);
      setUserNotice(null);

      try {
        const payload = await usersService.createUser(input);
        const createdUser = unwrapEnvelope(payload);

        setUsers((current) => sortUsers([createdUser, ...current]));
        setUserNoticeTone('success');
        setUserNotice('Usuario creado correctamente.');

        return createdUser;
      } catch (error) {
        const message = getApiErrorMessage(
          error,
          'No pude crear el usuario.',
        );

        if (message === 'Unauthorized.') {
          await logout();
          return null;
        }

        setUserNoticeTone('error');
        setUserNotice(message);
        return null;
      } finally {
        setIsSavingUser(false);
      }
    },
    [logout, token],
  );

  const handlePasswordReset = useCallback(
    async (userId: string): Promise<PasswordResetResponse | null> => {
      if (!token) {
        await logout();
        return null;
      }

      setResettingUserId(userId);
      setUserNotice(null);

      try {
        const payload = await usersService.resetUserPassword(userId);
        const result = unwrapEnvelope(payload);

        setUsers((current) =>
          current.map((user) =>
            user.id === userId
              ? {
                  ...user,
                  forcePasswordChange: true,
                  passwordChangedAt: null,
                }
              : user,
          ),
        );
        setLastResetResult(result);
        setUserNoticeTone('success');
        setUserNotice('Contraseña reiniciada correctamente.');
        return result;
      } catch (error) {
        const message = getApiErrorMessage(
          error,
          'No pude reiniciar la contraseña.',
        );
        if (message === 'Unauthorized.') {
          await logout();
          return null;
        }
        setUserNoticeTone('error');
        setUserNotice(message);
        return null;
      } finally {
        setResettingUserId(null);
      }
    },
    [logout, token],
  );

  const clearLastResetResult = useCallback((): void => {
    setLastResetResult(null);
  }, []);

  return {
    screenState,
    users,
    usersError,
    isSavingUser,
    resettingUserId,
    lastResetResult,
    userNotice,
    userNoticeTone,
    handleRetry: loadUsers,
    handleUserCreate,
    handlePasswordReset,
    clearLastResetResult,
  };
}

function sortUsers(items: UserOverview[]): UserOverview[] {
  return [...items].sort((left, right) =>
    left.fullName.localeCompare(right.fullName, 'es'),
  );
}
