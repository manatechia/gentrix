import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuthSession } from '../hooks/use-auth-session';

const FORCE_PASSWORD_CHANGE_ROUTE = '/cambiar-contrasena';

/**
 * Redirects any authenticated user with `forcePasswordChange=true` to the
 * forced-change screen. All existing route components wrap themselves with
 * this gate so the flag is enforced at the edge of every feature.
 */
export function ForcePasswordGate({ children }: { children: ReactNode }) {
  const auth = useAuthSession();
  const location = useLocation();

  if (
    auth.session?.user.forcePasswordChange &&
    location.pathname !== FORCE_PASSWORD_CHANGE_ROUTE
  ) {
    return <Navigate to={FORCE_PASSWORD_CHANGE_ROUTE} replace />;
  }

  return <>{children}</>;
}
