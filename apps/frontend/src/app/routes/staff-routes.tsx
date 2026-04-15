import { Navigate } from 'react-router-dom';

import { useAuthSession } from '../../features/auth/hooks/use-auth-session';
import { AuthCheckingScreen } from '../../features/auth/ui/auth-checking-screen';
import { useResidentsRoute } from '../../features/residents/hooks/use-residents-route';
import { useUsersRoute } from '../../features/users/hooks/use-users-route';
import { UsersAdminWorkspace } from '../../features/users/ui/users-admin-workspace';
import { canManageUsers } from '../../shared/lib/authz';

export function StaffSchedulesRoute() {
  const auth = useAuthSession();
  const residents = useResidentsRoute();
  const users = useUsersRoute();

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
    <UsersAdminWorkspace
      screenState={users.screenState}
      session={auth.session}
      residentCount={residents.residentCount}
      users={users.users}
      usersError={users.usersError}
      isSavingUser={users.isSavingUser}
      resettingUserId={users.resettingUserId}
      lastResetResult={users.lastResetResult}
      userNotice={users.userNotice}
      userNoticeTone={users.userNoticeTone}
      onUserCreate={users.handleUserCreate}
      onPasswordReset={users.handlePasswordReset}
      onClearResetResult={users.clearLastResetResult}
      onLogout={auth.logout}
      onRetry={users.handleRetry}
    />
  );
}
