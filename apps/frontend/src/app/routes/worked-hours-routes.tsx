import { Navigate } from 'react-router-dom';

import { useAuthSession } from '../../features/auth/hooks/use-auth-session';
import { AuthCheckingScreen } from '../../features/auth/ui/auth-checking-screen';
import { useResidentsRoute } from '../../features/residents/hooks/use-residents-route';
import { useWorkedHoursRoute } from '../../features/worked-hours/hooks/use-worked-hours-route';
import { WorkedHoursWorkspace } from '../../features/worked-hours/ui/worked-hours-workspace';
import { canManageUsers } from '../../shared/lib/authz';

export function WorkedHoursRoute() {
  const auth = useAuthSession();
  const residents = useResidentsRoute();
  const workedHours = useWorkedHoursRoute();

  if (auth.status === 'checking') {
    return <AuthCheckingScreen />;
  }

  if (!auth.session) {
    return <Navigate to="/login" replace />;
  }

  if (!canManageUsers(auth.session.user.role)) {
    return <Navigate to="/residentes" replace />;
  }

  return (
    <WorkedHoursWorkspace
      session={auth.session}
      residentCount={residents.residentCount}
      route={workedHours}
      onLogout={auth.logout}
    />
  );
}
