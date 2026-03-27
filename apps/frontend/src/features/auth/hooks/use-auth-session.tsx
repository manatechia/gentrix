import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import type { AuthLoginRequest, AuthSession } from '@gentrix/shared-types';

import {
  getApiErrorMessage,
  unwrapEnvelope,
} from '../../../shared/lib/api-envelope';
import {
  persistAuthToken,
  readStoredAuthToken,
} from '../../../shared/lib/auth-token-storage';
import * as authService from '../services/auth-service';

type AuthStatus = 'checking' | 'authenticated' | 'anonymous';

interface AuthSessionContextValue {
  status: AuthStatus;
  session: AuthSession | null;
  token: string | null;
  authError: string | null;
  isSubmitting: boolean;
  login: (credentials: AuthLoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

function getInitialToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return readStoredAuthToken();
}

export function AuthSessionProvider({ children }: PropsWithChildren) {
  const didRestoreSession = useRef(false);
  const [token, setToken] = useState<string | null>(getInitialToken);
  const [status, setStatus] = useState<AuthStatus>(() =>
    getInitialToken() ? 'checking' : 'anonymous',
  );
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    console.debug('[gentrix] auth provider:mount');

    const handleBeforeUnload = () => {
      console.debug('[gentrix] window:beforeunload');
    };

    const handlePageHide = () => {
      console.debug('[gentrix] window:pagehide');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      console.debug('[gentrix] auth provider:unmount');
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    console.debug('[gentrix] auth state', {
      status,
      hasToken: Boolean(token),
      hasSession: Boolean(session),
    });
  }, [session, status, token]);

  function resetSession(nextError: string | null = null): void {
    persistAuthToken(null);
    setToken(null);
    setSession(null);
    setAuthError(nextError);
    setStatus('anonymous');
  }

  useEffect(() => {
    if (didRestoreSession.current) {
      return;
    }

    didRestoreSession.current = true;
    const storedToken = token ?? readStoredAuthToken();

    if (!storedToken) {
      setStatus('anonymous');
      return;
    }

    void (async () => {
      try {
        if (import.meta.env.DEV) {
          console.debug('[gentrix] auth restore:start');
        }

        const payload = await authService.getSession();

        setToken(storedToken);
        setSession(unwrapEnvelope(payload));
        setAuthError(null);
        setStatus('authenticated');

        if (import.meta.env.DEV) {
          console.debug('[gentrix] auth restore:success');
        }
      } catch {
        if (import.meta.env.DEV) {
          console.debug('[gentrix] auth restore:reset');
        }

        resetSession();
      }
    })();
  }, [token]);

  const login = useCallback(async (credentials: AuthLoginRequest): Promise<void> => {
    setIsSubmitting(true);
    setAuthError(null);

    if (import.meta.env.DEV) {
      console.debug('[gentrix] auth login:start', {
        email: credentials.email,
      });
    }

    try {
      const payload = await authService.login(credentials);
      const nextSession = unwrapEnvelope(payload);

      persistAuthToken(nextSession.token);
      setToken(nextSession.token);
      setSession({
        user: nextSession.user,
        activeOrganization: nextSession.activeOrganization,
        activeFacility: nextSession.activeFacility,
        expiresAt: nextSession.expiresAt,
      });
      setStatus('authenticated');

      if (import.meta.env.DEV) {
        console.debug('[gentrix] auth login:success', {
          userId: nextSession.user.id,
        });
      }
    } catch (error) {
      setAuthError(getApiErrorMessage(error, 'No pude iniciar sesion.'));
      setStatus('anonymous');

      if (import.meta.env.DEV) {
        console.debug('[gentrix] auth login:error', error);
      }

      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    if (import.meta.env.DEV) {
      console.debug('[gentrix] auth logout:start');
    }

    if (token) {
      try {
        await authService.logout();
      } catch {
        // Best effort while sessions remain simple.
      }
    }

    resetSession();
  }, [token]);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      status,
      session,
      token,
      authError,
      isSubmitting,
      login,
      logout,
      clearAuthError: () => setAuthError(null),
    }),
    [authError, isSubmitting, login, logout, session, status, token],
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession(): AuthSessionContextValue {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error('useAuthSession must be used within AuthSessionProvider.');
  }

  return context;
}
