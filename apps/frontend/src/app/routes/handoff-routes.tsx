import { Navigate } from 'react-router-dom';

import { useAuthSession } from '../../features/auth/hooks/use-auth-session';
import { AuthCheckingScreen } from '../../features/auth/ui/auth-checking-screen';
import { useHandoffRoute } from '../../features/handoff/hooks/use-handoff-route';
import { HandoffWorkspace } from '../../features/handoff/ui/handoff-workspace';

export function HandoffRoute() {
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
