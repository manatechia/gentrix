import { Navigate } from 'react-router-dom';

import { useAuthSession } from '../../features/auth/hooks/use-auth-session';
import { AuthCheckingScreen } from '../../features/auth/ui/auth-checking-screen';
import { LoginScreen } from '../../features/auth/ui/login-screen';
import { useDashboardRoute } from '../../features/dashboard/hooks/use-dashboard-route';
import { useUpcomingAgenda } from '../../features/dashboard/hooks/use-upcoming-agenda';
import { DashboardWorkspace } from '../../features/dashboard/ui/dashboard-workspace';

export function LoginRoute() {
  const auth = useAuthSession();

  if (auth.status === 'authenticated' && auth.session) {
    return (
      <Navigate
        to={
          auth.session.user.forcePasswordChange
            ? '/cambiar-contrasena'
            : '/dashboard'
        }
        replace
      />
    );
  }

  if (auth.status === 'checking') {
    return <AuthCheckingScreen />;
  }

  return (
    <LoginScreen
      isCheckingSession={false}
      authError={auth.authError}
      isSubmitting={auth.isSubmitting}
      onSubmit={auth.login}
      onClearError={auth.clearAuthError}
    />
  );
}

export function DashboardRoute() {
  const auth = useAuthSession();
  const dashboard = useDashboardRoute();
  const upcomingAgenda = useUpcomingAgenda();

  if (auth.status === 'checking') {
    return <AuthCheckingScreen />;
  }

  if (!auth.session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <DashboardWorkspace
      screenState={dashboard.screenState}
      session={auth.session}
      dashboard={dashboard.dashboard}
      authError={dashboard.dashboardError}
      residentCount={dashboard.residentCount}
      medications={dashboard.medications}
      upcomingAgendaEvents={upcomingAgenda.events}
      onLogout={auth.logout}
      onRetry={dashboard.handleRetry}
    />
  );
}

export function RootRedirect() {
  const auth = useAuthSession();

  if (auth.status === 'checking') {
    return <AuthCheckingScreen />;
  }

  if (!auth.session) {
    return <Navigate to="/login" replace />;
  }

  if (auth.session.user.forcePasswordChange) {
    return <Navigate to="/cambiar-contrasena" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}
