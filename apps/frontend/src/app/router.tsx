import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';

import { useAuthSession } from '../features/auth/hooks/use-auth-session';
import { AuthCheckingScreen } from '../features/auth/ui/auth-checking-screen';
import { LoginScreen } from '../features/auth/ui/login-screen';
import { useDashboardRoute } from '../features/dashboard/hooks/use-dashboard-route';
import { DashboardWorkspace } from '../features/dashboard/ui/dashboard-workspace';
import { useResidentDetailRoute } from '../features/residents/hooks/use-resident-detail-route';
import { useResidentsRoute } from '../features/residents/hooks/use-residents-route';
import { ResidentCreateWorkspace } from '../features/residents/ui/resident-create-workspace';
import { ResidentDetailWorkspace } from '../features/residents/ui/resident-detail-workspace';
import { ResidentsWorkspace } from '../features/residents/ui/residents-workspace';

function LoginRoute() {
  const auth = useAuthSession();

  if (auth.status === 'authenticated' && auth.session) {
    return <Navigate to="/dashboard" replace />;
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

function DashboardRoute() {
  const auth = useAuthSession();
  const dashboard = useDashboardRoute();

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
      onLogout={auth.logout}
      onRetry={dashboard.handleRetry}
    />
  );
}

function ResidentsRoute() {
  const auth = useAuthSession();
  const residents = useResidentsRoute();

  if (auth.status === 'checking') {
    return <AuthCheckingScreen />;
  }

  if (!auth.session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <ResidentsWorkspace
      screenState={residents.screenState}
      session={auth.session}
      authError={residents.residentsError}
      residentCount={residents.residentCount}
      memoryCareResidents={residents.memoryCareResidents}
      residents={residents.residents}
      onLogout={auth.logout}
      onRetry={residents.handleRetry}
    />
  );
}

function ResidentCreateRoute() {
  const auth = useAuthSession();
  const residents = useResidentsRoute();
  const navigate = useNavigate();

  if (auth.status === 'checking') {
    return <AuthCheckingScreen />;
  }

  if (!auth.session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <ResidentCreateWorkspace
      screenState={residents.screenState}
      session={auth.session}
      authError={residents.residentsError}
      isSavingResident={residents.isSavingResident}
      residentCount={residents.residentCount}
      residentNoticeTone={residents.residentNoticeTone}
      residentNotice={residents.residentNotice}
      onResidentCreate={async (values) => {
        const createdResident = await residents.handleResidentCreate(values);

        if (createdResident) {
          navigate(`/residentes/${createdResident.id}`, { replace: true });
        }
      }}
      onLogout={auth.logout}
    />
  );
}

function ResidentDetailRoute() {
  const auth = useAuthSession();
  const residents = useResidentsRoute();
  const { residentId } = useParams();
  const detail = useResidentDetailRoute(residentId);

  if (auth.status === 'checking') {
    return <AuthCheckingScreen />;
  }

  if (!auth.session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <ResidentDetailWorkspace
      screenState={detail.screenState}
      session={auth.session}
      residentCount={residents.residentCount}
      resident={detail.resident}
      residentError={detail.residentError}
      onLogout={auth.logout}
      onRetry={detail.handleRetry}
    />
  );
}

function RootRedirect() {
  const auth = useAuthSession();

  if (auth.status === 'checking') {
    return <AuthCheckingScreen />;
  }

  return (
    <Navigate to={auth.session ? '/dashboard' : '/login'} replace />
  );
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/dashboard" element={<DashboardRoute />} />
      <Route path="/residentes" element={<ResidentsRoute />} />
      <Route path="/residentes/nuevo" element={<ResidentCreateRoute />} />
      <Route path="/residentes/:residentId" element={<ResidentDetailRoute />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
