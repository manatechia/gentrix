import { useState } from 'react';
import {
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router-dom';

import { useAuthSession } from '../features/auth/hooks/use-auth-session';
import { AuthCheckingScreen } from '../features/auth/ui/auth-checking-screen';
import { useDashboardRoute } from '../features/dashboard/hooks/use-dashboard-route';
import { DashboardWorkspace } from '../features/dashboard/ui/dashboard-workspace';
import { useHandoffRoute } from '../features/handoff/hooks/use-handoff-route';
import { HandoffWorkspace } from '../features/handoff/ui/handoff-workspace';
import { LoginScreen } from '../features/auth/ui/login-screen';
import { useMedicationEditRoute } from '../features/medication/hooks/use-medication-edit-route';
import { useMedicationsRoute } from '../features/medication/hooks/use-medications-route';
import { MedicationCreateWorkspace } from '../features/medication/ui/medication-create-workspace';
import { MedicationEditWorkspace } from '../features/medication/ui/medication-edit-workspace';
import { MedicationsWorkspace } from '../features/medication/ui/medications-workspace';
import { useResidentEditRoute } from '../features/residents/hooks/use-resident-edit-route';
import { useResidentDetailRoute } from '../features/residents/hooks/use-resident-detail-route';
import { useResidentsRoute } from '../features/residents/hooks/use-residents-route';
import { ResidentCreateWorkspace } from '../features/residents/ui/resident-create-workspace';
import { ResidentDetailWorkspace } from '../features/residents/ui/resident-detail-workspace';
import { ResidentEditWorkspace } from '../features/residents/ui/resident-edit-workspace';
import { ResidentsWorkspace } from '../features/residents/ui/residents-workspace';
import {
  canManageMedicationOrders,
  canManageResidents,
} from '../shared/lib/authz';

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

  if (!canManageResidents(auth.session.user.role)) {
    return <Navigate to="/residentes" replace />;
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
      residentLiveProfile={detail.residentLiveProfile}
      residentError={detail.residentError}
      onLogout={auth.logout}
      onRetry={detail.handleRetry}
    />
  );
}

function ResidentEditRoute() {
  const auth = useAuthSession();
  const residents = useResidentsRoute();
  const { residentId } = useParams();
  const edit = useResidentEditRoute(residentId);
  const navigate = useNavigate();

  if (auth.status === 'checking') {
    return <AuthCheckingScreen />;
  }

  if (!auth.session) {
    return <Navigate to="/login" replace />;
  }

  if (!canManageResidents(auth.session.user.role)) {
    return (
      <Navigate
        to={residentId ? `/residentes/${residentId}` : '/residentes'}
        replace
      />
    );
  }

  return (
    <ResidentEditWorkspace
      screenState={edit.screenState}
      session={auth.session}
      residentCount={residents.residentCount}
      resident={edit.resident}
      residentError={edit.residentError}
      isSavingResident={edit.isSavingResident}
      residentNoticeTone={edit.residentNoticeTone}
      residentNotice={edit.residentNotice}
      onResidentUpdate={async (values) => {
        const updatedResident = await edit.handleResidentUpdate(values);

        if (updatedResident) {
          navigate(`/residentes/${updatedResident.id}`, {
            replace: true,
            state: {
              residentNotice: `Paciente ${updatedResident.fullName} actualizado correctamente.`,
              residentNoticeTone: 'success',
            },
          });
        }
      }}
      onLogout={auth.logout}
      onRetry={edit.handleRetry}
    />
  );
}

function MedicationsRoute() {
  const auth = useAuthSession();
  const medications = useMedicationsRoute();

  if (auth.status === 'checking') {
    return <AuthCheckingScreen />;
  }

  if (!auth.session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <MedicationsWorkspace
      screenState={medications.screenState}
      session={auth.session}
      authError={medications.medicationsError}
      residentCount={medications.residentCount}
      medicationCount={medications.medicationCount}
      activeMedicationCount={medications.activeMedicationCount}
      medications={medications.medications}
      medicationExecutionsByMedicationId={
        medications.medicationExecutionsByMedicationId
      }
      recordingMedicationExecutionId={
        medications.recordingMedicationExecutionId
      }
      medicationNotice={medications.medicationNotice}
      medicationNoticeTone={medications.medicationNoticeTone}
      residentOptions={medications.residentOptions}
      onCreateMedicationExecution={medications.handleMedicationExecutionCreate}
      onLogout={auth.logout}
      onRetry={medications.handleRetry}
    />
  );
}

function HandoffRoute() {
  const auth = useAuthSession();
  const handoff = useHandoffRoute();

  if (auth.status === 'checking') {
    return <AuthCheckingScreen />;
  }

  if (!auth.session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <HandoffWorkspace
      screenState={handoff.screenState}
      session={auth.session}
      handoff={handoff.handoff}
      handoffError={handoff.handoffError}
      residentCount={handoff.residentCount}
      onLogout={auth.logout}
      onRetry={handoff.handleRetry}
    />
  );
}

function MedicationCreateRoute() {
  const auth = useAuthSession();
  const medications = useMedicationsRoute();

  if (auth.status === 'checking') {
    return <AuthCheckingScreen />;
  }

  if (!auth.session) {
    return <Navigate to="/login" replace />;
  }

  if (!canManageMedicationOrders(auth.session.user.role)) {
    return <Navigate to="/medicacion" replace />;
  }

  return (
    <MedicationCreateWorkspace
      screenState={medications.screenState}
      session={auth.session}
      authError={medications.medicationsError}
      residentCount={medications.residentCount}
      medicationCount={medications.medicationCount}
      residentOptions={medications.residentOptions}
      medicationCatalogOptions={medications.medicationCatalogOptions}
      isSavingMedication={medications.isSavingMedication}
      medicationNoticeTone={medications.medicationNoticeTone}
      medicationNotice={medications.medicationNotice}
      onMedicationCreate={medications.handleMedicationCreate}
      onLogout={auth.logout}
    />
  );
}

function MedicationEditRoute() {
  const auth = useAuthSession();
  const { medicationId } = useParams();
  const edit = useMedicationEditRoute(medicationId);
  const [redirectState, setRedirectState] = useState<{
    medicationNotice: string;
    medicationNoticeTone: 'success' | 'error';
  } | null>(null);

  if (auth.status === 'checking') {
    return <AuthCheckingScreen />;
  }

  if (!auth.session) {
    return <Navigate to="/login" replace />;
  }

  if (!canManageMedicationOrders(auth.session.user.role)) {
    return <Navigate to="/medicacion" replace />;
  }

  if (redirectState) {
    return <Navigate to="/medicacion" replace state={redirectState} />;
  }

  return (
    <MedicationEditWorkspace
      screenState={edit.screenState}
      session={auth.session}
      residentCount={edit.residentCount}
      medication={edit.medication}
      medicationError={edit.medicationError}
      residentOptions={edit.residentOptions}
      medicationCatalogOptions={edit.medicationCatalogOptions}
      isSavingMedication={edit.isSavingMedication}
      medicationNoticeTone={edit.medicationNoticeTone}
      medicationNotice={edit.medicationNotice}
      onMedicationUpdate={async (values) => {
        const updatedMedication = await edit.handleMedicationUpdate(values);

        if (updatedMedication) {
          setRedirectState({
            medicationNotice: `Orden de ${updatedMedication.medicationName} actualizada correctamente.`,
            medicationNoticeTone: 'success',
          });
        }
      }}
      onLogout={auth.logout}
      onRetry={edit.handleRetry}
    />
  );
}

function RootRedirect() {
  const auth = useAuthSession();

  if (auth.status === 'checking') {
    return <AuthCheckingScreen />;
  }

  return <Navigate to={auth.session ? '/dashboard' : '/login'} replace />;
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
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/dashboard" element={<DashboardRoute />} />
      <Route path="/handoff" element={<HandoffRoute />} />
      <Route path="/residentes" element={<ResidentsRoute />} />
      <Route path="/residentes/nuevo" element={<ResidentCreateRoute />} />
      <Route
        path="/residentes/:residentId/editar"
        element={<ResidentEditRoute />}
      />
      <Route path="/residentes/:residentId" element={<ResidentDetailRoute />} />
      <Route path="/medicacion" element={<MedicationsRoute />} />
      <Route path="/medicacion/nueva" element={<MedicationCreateRoute />} />
      <Route
        path="/medicacion/:medicationId/editar"
        element={<MedicationEditRoute />}
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
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
