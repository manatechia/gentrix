import { useEffect, useState, type PropsWithChildren } from 'react';
import { useLocation } from 'react-router-dom';

import type { AuthSession } from '@gentrix/shared-types';

import { shellCardClassName } from '../../../shared/ui/class-names';
import { Sidebar } from './sidebar';

const mobileSidebarMediaQuery = '(max-width: 1180px)';

function readIsMobileSidebar(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia(mobileSidebarMediaQuery).matches;
}

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
  const location = useLocation();
  const [isMobileSidebar, setIsMobileSidebar] = useState(readIsMobileSidebar);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(mobileSidebarMediaQuery);

    function handleChange(event: MediaQueryListEvent): void {
      setIsMobileSidebar(event.matches);
    }

    setIsMobileSidebar(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.hash, location.pathname, location.search]);

  useEffect(() => {
    if (!isMobileSidebar && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [isMobileSidebar, isSidebarOpen]);

  useEffect(() => {
    if (!isMobileSidebar || !isSidebarOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false);
      }
    }

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileSidebar, isSidebarOpen]);

  function closeSidebar(): void {
    setIsSidebarOpen(false);
  }

  function toggleSidebar(): void {
    setIsSidebarOpen((current) => !current);
  }

  return (
    <main className="relative min-h-screen text-brand-text">
      {isMobileSidebar && isSidebarOpen && (
        <button
          aria-label="Cerrar menu lateral"
          className="fixed inset-0 z-40 bg-[rgba(31,37,42,0.34)] backdrop-blur-[2px] min-[1181px]:hidden"
          type="button"
          onClick={closeSidebar}
        />
      )}

      <section className="grid min-h-screen grid-cols-1 items-start min-[1181px]:grid-cols-[282px_minmax(0,1fr)]">
        <Sidebar
          residentCount={residentCount}
          session={session}
          onLogout={onLogout}
          isMobileOpen={isSidebarOpen}
          isMobileViewport={isMobileSidebar}
          onClose={closeSidebar}
        />

        <section className="grid gap-5 px-7 py-6 pb-10 max-sm:px-[18px] max-sm:py-[18px]">
          <div
            className={`${shellCardClassName} flex items-center justify-between gap-4 p-3 min-[1181px]:hidden`}
          >
            <div className="flex items-center gap-3">
              <button
                aria-controls="workspace-sidebar"
                aria-expanded={isSidebarOpen}
                aria-label={
                  isSidebarOpen
                    ? 'Cerrar menu lateral'
                    : 'Abrir menu lateral'
                }
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(0,102,132,0.12)] bg-brand-neutral text-brand-secondary transition hover:border-[rgba(0,102,132,0.2)] hover:bg-white"
                type="button"
                onClick={toggleSidebar}
              >
                <span className="grid gap-1.5">
                  <span className="block h-0.5 w-5 rounded-full bg-current" />
                  <span className="block h-0.5 w-5 rounded-full bg-current" />
                  <span className="block h-0.5 w-5 rounded-full bg-current" />
                </span>
              </button>

              <div>
                <span className="block text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
                  Navegacion
                </span>
                <strong className="block text-[1rem] font-semibold text-brand-text">
                  Gentrix MVP
                </strong>
              </div>
            </div>

            <span className="inline-flex min-h-10 items-center justify-center rounded-full bg-brand-primary/10 px-3 text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-brand-primary">
              Menu
            </span>
          </div>

          {children}
        </section>
      </section>
    </main>
  );
}
