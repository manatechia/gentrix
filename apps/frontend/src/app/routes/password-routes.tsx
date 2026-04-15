import { Navigate } from 'react-router-dom';

import { useAuthSession } from '../../features/auth/hooks/use-auth-session';
import { AuthCheckingScreen } from '../../features/auth/ui/auth-checking-screen';
import { ForcePasswordChangeScreen } from '../../features/auth/ui/force-password-change-screen';

export function ForcePasswordChangeRoute() {
  const auth = useAuthSession();

  if (auth.status === 'checking') {
    return <AuthCheckingScreen />;
  }

  if (!auth.session) {
    return <Navigate to="/login" replace />;
  }

  // If the user has already cleared the flag, bounce them to the dashboard
  // so they cannot stay on the change-password screen by guessing the URL.
  if (!auth.session.user.forcePasswordChange) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <ForcePasswordChangeScreen
      onCompleted={auth.refreshSession}
      onLogout={auth.logout}
    />
  );
}
