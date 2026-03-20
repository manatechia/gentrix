import type { PropsWithChildren } from 'react';

import type { AuthSession } from '@gentrix/shared-types';

import { Sidebar } from './sidebar';

interface WorkspaceShellProps extends PropsWithChildren {
  residentCount: number;
  session: AuthSession;
  onLogout: () => void | Promise<void>;
}

export function WorkspaceShell({
  children,
  residentCount,
  session,
  onLogout,
}: WorkspaceShellProps) {
  return (
    <main className="min-h-screen text-brand-text">
      <section className="grid min-h-screen grid-cols-[282px_minmax(0,1fr)] items-start max-[1180px]:grid-cols-1">
        <Sidebar
          residentCount={residentCount}
          session={session}
          onLogout={onLogout}
        />

        <section className="grid gap-5 px-7 py-6 pb-10 max-sm:px-[18px] max-sm:py-[18px]">
          {children}
        </section>
      </section>
    </main>
  );
}
