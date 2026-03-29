import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { useAuthSession } from '../../features/auth/hooks/use-auth-session';
import { AuthCheckingScreen } from '../../features/auth/ui/auth-checking-screen';
import { useResidentEditRoute } from '../../features/residents/hooks/use-resident-edit-route';
import { useResidentDetailRoute } from '../../features/residents/hooks/use-resident-detail-route';
import { useResidentsRoute } from '../../features/residents/hooks/use-residents-route';
import { ResidentCreateWorkspace } from '../../features/residents/ui/resident-create-workspace';
import { ResidentDetailWorkspace } from '../../features/residents/ui/resident-detail-workspace';
import { ResidentEditWorkspace } from '../../features/residents/ui/resident-edit-workspace';
import { ResidentsWorkspace } from '../../features/residents/ui/residents-workspace';
import { canManageResidents } from '../../shared/lib/authz';

export function ResidentsRoute() {
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

export function ResidentCreateRoute() {
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

export function ResidentDetailRoute() {
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
      clinicalHistory={detail.clinicalHistory}
      residentError={detail.residentError}
      isSavingClinicalHistoryEvent={detail.isSavingClinicalHistoryEvent}
      clinicalHistoryNoticeTone={detail.clinicalHistoryNoticeTone}
      clinicalHistoryNotice={detail.clinicalHistoryNotice}
      onLogout={auth.logout}
      onRetry={detail.handleRetry}
      onClinicalHistoryCreate={detail.handleClinicalHistoryCreate}
    />
  );
}

export function ResidentEditRoute() {
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
