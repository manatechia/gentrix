import { Suspense, lazy, type ReactNode } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';

import { AuthCheckingScreen } from '../features/auth/ui/auth-checking-screen';
import { ForcePasswordGate } from '../features/auth/ui/force-password-gate';

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
const ForcePasswordChangeRoute = lazy(async () => {
  const module = await import('./routes/password-routes');

  return { default: module.ForcePasswordChangeRoute };
});
const WorkedHoursRoute = lazy(async () => {
  const module = await import('./routes/worked-hours-routes');

  return { default: module.WorkedHoursRoute };
});

function renderRoute(element: ReactNode) {
  return <Suspense fallback={<AuthCheckingScreen />}>{element}</Suspense>;
}

// Wraps every authenticated route with the forced-change gate so a user that
// must pick a new password can't bypass the screen by typing a URL.
function gated(element: ReactNode) {
  return <ForcePasswordGate>{element}</ForcePasswordGate>;
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
      <Route
        path="/cambiar-contrasena"
        element={renderRoute(<ForcePasswordChangeRoute />)}
      />
      <Route
        path="/dashboard"
        element={renderRoute(gated(<DashboardRoute />))}
      />
      <Route path="/handoff" element={renderRoute(gated(<HandoffRoute />))} />
      <Route
        path="/residentes"
        element={renderRoute(gated(<ResidentsRoute />))}
      />
      <Route
        path="/residentes/nuevo"
        element={renderRoute(gated(<ResidentCreateRoute />))}
      />
      <Route
        path="/residentes/:residentId/editar"
        element={renderRoute(gated(<ResidentEditRoute />))}
      />
      <Route
        path="/residentes/:residentId"
        element={renderRoute(gated(<ResidentDetailRoute />))}
      />
      <Route
        path="/personal"
        element={renderRoute(gated(<StaffSchedulesRoute />))}
      />
      <Route
        path="/personal/horas"
        element={renderRoute(gated(<WorkedHoursRoute />))}
      />
      <Route path="/horas" element={<Navigate to="/personal/horas" replace />} />
      <Route
        path="/medicacion"
        element={renderRoute(gated(<MedicationsRoute />))}
      />
      <Route
        path="/medicacion/nueva"
        element={renderRoute(gated(<MedicationCreateRoute />))}
      />
      <Route
        path="/medicacion/:medicationId/editar"
        element={renderRoute(gated(<MedicationEditRoute />))}
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
