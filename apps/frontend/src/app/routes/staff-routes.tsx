import { Navigate } from 'react-router-dom';

import { useAuthSession } from '../../features/auth/hooks/use-auth-session';
import { AuthCheckingScreen } from '../../features/auth/ui/auth-checking-screen';
import { useResidentsRoute } from '../../features/residents/hooks/use-residents-route';
import { useStaffSchedulesRoute } from '../../features/staff/hooks/use-staff-schedules-route';
import { StaffSchedulesWorkspace } from '../../features/staff/ui/staff-schedules-workspace';

export function StaffSchedulesRoute() {
  const auth = useAuthSession();
  const residents = useResidentsRoute();
  const staffSchedules = useStaffSchedulesRoute();

  if (auth.status === 'checking') {
    return <AuthCheckingScreen />;
  }

  if (!auth.session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <StaffSchedulesWorkspace
      screenState={staffSchedules.screenState}
      session={auth.session}
      residentCount={residents.residentCount}
      staff={staffSchedules.staff}
      selectedStaffId={staffSchedules.selectedStaffId}
      schedules={staffSchedules.schedules}
      staffError={staffSchedules.staffError}
      isLoadingSchedules={staffSchedules.isLoadingSchedules}
      isSavingSchedule={staffSchedules.isSavingSchedule}
      scheduleNotice={staffSchedules.scheduleNotice}
      scheduleNoticeTone={staffSchedules.scheduleNoticeTone}
      onSelectStaff={staffSchedules.handleSelectStaff}
      onScheduleCreate={staffSchedules.handleScheduleCreate}
      onScheduleUpdate={staffSchedules.handleScheduleUpdate}
      onLogout={auth.logout}
      onRetry={staffSchedules.handleRetry}
    />
  );
}
