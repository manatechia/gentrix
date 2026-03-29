import { Suspense, lazy, type ReactNode } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';

import { AuthCheckingScreen } from '../features/auth/ui/auth-checking-screen';

const LoginRoute = lazy(async () => {
  const module = await import('./routes/auth-routes');

  return { default: module.LoginRoute };
});
const DashboardRoute = lazy(async () => {
  const module = await import('./routes/auth-routes');

  return { default: module.DashboardRoute };
});
const RootRedirect = lazy(async () => {
  const module = await import('./routes/auth-routes');

  return { default: module.RootRedirect };
});
const HandoffRoute = lazy(async () => {
  const module = await import('./routes/handoff-routes');

  return { default: module.HandoffRoute };
});
const ResidentsRoute = lazy(async () => {
  const module = await import('./routes/resident-routes');

  return { default: module.ResidentsRoute };
});
const ResidentCreateRoute = lazy(async () => {
  const module = await import('./routes/resident-routes');

  return { default: module.ResidentCreateRoute };
});
const ResidentEditRoute = lazy(async () => {
  const module = await import('./routes/resident-routes');

  return { default: module.ResidentEditRoute };
});
const ResidentDetailRoute = lazy(async () => {
  const module = await import('./routes/resident-routes');

  return { default: module.ResidentDetailRoute };
});
const StaffSchedulesRoute = lazy(async () => {
  const module = await import('./routes/staff-routes');

  return { default: module.StaffSchedulesRoute };
});
const MedicationsRoute = lazy(async () => {
  const module = await import('./routes/medication-routes');

  return { default: module.MedicationsRoute };
});
const MedicationCreateRoute = lazy(async () => {
  const module = await import('./routes/medication-routes');

  return { default: module.MedicationCreateRoute };
});
const MedicationEditRoute = lazy(async () => {
  const module = await import('./routes/medication-routes');

  return { default: module.MedicationEditRoute };
});

function renderRoute(element: ReactNode) {
  return <Suspense fallback={<AuthCheckingScreen />}>{element}</Suspense>;
}

function MedicationPluralEditRedirect() {
  const { medicationId } = useParams();

  if (!medicationId) {
    return <Navigate to="/medicacion" replace />;
  }

  return <Navigate to={`/medicacion/${medicationId}/editar`} replace />;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={renderRoute(<RootRedirect />)} />
      <Route path="/login" element={renderRoute(<LoginRoute />)} />
      <Route path="/dashboard" element={renderRoute(<DashboardRoute />)} />
      <Route path="/handoff" element={renderRoute(<HandoffRoute />)} />
      <Route path="/residentes" element={renderRoute(<ResidentsRoute />)} />
      <Route
        path="/residentes/nuevo"
        element={renderRoute(<ResidentCreateRoute />)}
      />
      <Route
        path="/residentes/:residentId/editar"
        element={renderRoute(<ResidentEditRoute />)}
      />
      <Route
        path="/residentes/:residentId"
        element={renderRoute(<ResidentDetailRoute />)}
      />
      <Route path="/personal" element={renderRoute(<StaffSchedulesRoute />)} />
      <Route path="/medicacion" element={renderRoute(<MedicationsRoute />)} />
      <Route
        path="/medicacion/nueva"
        element={renderRoute(<MedicationCreateRoute />)}
      />
      <Route
        path="/medicacion/:medicationId/editar"
        element={renderRoute(<MedicationEditRoute />)}
      />
      <Route
        path="/medicaciones"
        element={<Navigate to="/medicacion" replace />}
      />
      <Route
        path="/medicaciones/nueva"
        element={<Navigate to="/medicacion/nueva" replace />}
      />
      <Route
        path="/medicaciones/:medicationId/editar"
        element={<MedicationPluralEditRedirect />}
      />
      <Route path="*" element={renderRoute(<RootRedirect />)} />
    </Routes>
  );
}
