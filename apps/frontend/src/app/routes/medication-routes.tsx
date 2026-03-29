import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';

import { useAuthSession } from '../../features/auth/hooks/use-auth-session';
import { AuthCheckingScreen } from '../../features/auth/ui/auth-checking-screen';
import { useMedicationEditRoute } from '../../features/medication/hooks/use-medication-edit-route';
import { useMedicationsRoute } from '../../features/medication/hooks/use-medications-route';
import { MedicationCreateWorkspace } from '../../features/medication/ui/medication-create-workspace';
import { MedicationEditWorkspace } from '../../features/medication/ui/medication-edit-workspace';
import { MedicationsWorkspace } from '../../features/medication/ui/medications-workspace';
import { canManageMedicationOrders } from '../../shared/lib/authz';

export function MedicationsRoute() {
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

export function MedicationCreateRoute() {
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

export function MedicationEditRoute() {
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
