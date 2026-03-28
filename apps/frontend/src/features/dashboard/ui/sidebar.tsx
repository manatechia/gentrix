import { NavLink } from 'react-router-dom';

import type { AuthSession } from '@gentrix/shared-types';

import { formatAuthRole } from '../../../shared/lib/display-labels';
import { sidebarButtonClassName } from '../../../shared/ui/class-names';
import { sidebarSections } from '../constants/sidebar-sections';

interface SidebarProps {
  residentCount: number;
  session: AuthSession;
  onLogout: () => void | Promise<void>;
  isMobileOpen: boolean;
  isMobileViewport: boolean;
  onClose: () => void;
}

export function Sidebar({
  residentCount,
  session,
  onLogout,
  isMobileOpen,
  isMobileViewport,
  onClose,
}: SidebarProps) {
  const mobileVisibilityClassName = isMobileOpen
    ? 'max-[1180px]:translate-x-0 max-[1180px]:opacity-100 max-[1180px]:pointer-events-auto'
    : 'max-[1180px]:-translate-x-[110%] max-[1180px]:opacity-0 max-[1180px]:pointer-events-none';

  return (
    <aside
      id="workspace-sidebar"
      data-testid="workspace-sidebar"
      aria-hidden={isMobileViewport ? !isMobileOpen : undefined}
      className={[
        'flex min-h-0 flex-col gap-3.5 overflow-x-hidden bg-[linear-gradient(180deg,rgba(47,79,79,0.98),rgba(37,63,63,0.98))] px-[18px] py-[22px] text-white shadow-sidebar',
        'min-[1181px]:sticky min-[1181px]:top-0 min-[1181px]:z-10 min-[1181px]:h-screen min-[1181px]:max-h-screen min-[1181px]:overflow-hidden min-[1181px]:rounded-r-[28px]',
        'max-[1180px]:fixed max-[1180px]:inset-y-0 max-[1180px]:left-0 max-[1180px]:z-50 max-[1180px]:h-screen max-[1180px]:w-[min(86vw,320px)] max-[1180px]:max-h-screen max-[1180px]:rounded-r-[28px] max-[1180px]:transition-[transform,opacity] max-[1180px]:duration-200 max-[1180px]:ease-out',
        'max-[1180px]:overflow-y-auto',
        mobileVisibilityClassName,
      ].join(' ')}
    >
      <div className="shrink-0 flex items-center justify-between gap-3.5">
        <div className="flex items-center gap-3.5">
          <div className="grid h-[46px] w-[46px] place-items-center rounded-[14px] bg-[linear-gradient(180deg,#def6fb,#b7e7f0)] font-bold text-brand-secondary">
            G
          </div>
          <div>
            <strong className="block text-[0.98rem] font-bold">
              Gentrix MVP
            </strong>
            <span className="mt-1 block text-[0.78rem] uppercase tracking-[0.12em] text-white/72">
              OPERACION CENTRALIZADA
            </span>
          </div>
        </div>

        <button
          aria-label="Cerrar menu lateral"
          className="grid h-11 w-11 place-items-center rounded-2xl border border-white/14 bg-white/8 text-white transition hover:bg-white/12 min-[1181px]:hidden"
          type="button"
          onClick={onClose}
        >
          <span className="relative block h-4 w-4">
            <span className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 rotate-45 rounded-full bg-current" />
            <span className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 -rotate-45 rounded-full bg-current" />
          </span>
        </button>
      </div>

      <div className="shrink-0 grid gap-1.5 rounded-[22px] border border-white/10 bg-white/8 p-4">
        <span className="text-[0.76rem] uppercase tracking-[0.16em] text-white/72">
          Residentes
        </span>
        <strong className="text-[1.8rem] leading-none tracking-[-0.06em]">
          {residentCount}
        </strong>
      </div>

      <nav className="grid min-h-0 flex-1 gap-2 overflow-y-auto pr-1">
        {sidebarSections.map((section) => (
          <NavLink
            key={section.label}
            to={section.path}
            end={section.end}
            onClick={onClose}
          >
            {({ isActive }) => (
              <span
                className={[
                  sidebarButtonClassName,
                  'relative overflow-hidden transition',
                  isActive
                    ? 'border-[rgba(171,230,240,0.28)] bg-brand-primary/28 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_14px_30px_rgba(0,102,132,0.18)]'
                    : 'bg-white/4 hover:bg-white/8',
                ].join(' ')}
              >
                <span
                  className={[
                    'absolute bottom-0 left-0 top-0 w-1 rounded-r-full transition',
                    isActive ? 'bg-[#d8f5fb]' : 'bg-transparent',
                  ].join(' ')}
                />
                <span
                  className={[
                    'grid h-[38px] w-[38px] place-items-center rounded-xl text-[0.78rem] font-bold transition',
                    isActive
                      ? 'bg-[rgba(216,245,251,0.18)] text-[#f1fcff]'
                      : 'bg-white/12 text-white',
                  ].join(' ')}
                >
                  {section.badge}
                </span>
                <span className="grid gap-1">
                  <strong
                    className={[
                      'text-[0.9rem] font-semibold transition',
                      isActive ? 'text-[#f4fdff]' : 'text-white',
                    ].join(' ')}
                  >
                    {section.label}
                  </strong>
                  <span
                    className={[
                      'text-[0.84rem] leading-[1.45] transition',
                      isActive ? 'text-white/88' : 'text-white/72',
                    ].join(' ')}
                  >
                    {section.meta}
                  </span>
                </span>
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto shrink-0 grid gap-3 border-t border-white/12 pt-3.5">
        <div className="grid gap-1.5 rounded-[22px] border border-white/12 bg-white/8 px-4 py-3.5">
          <strong className="text-[0.98rem] font-semibold text-white">
            {session.user.fullName}
          </strong>
          <span className="text-[0.94rem] text-white/74">
            {session.user.email}
          </span>
          <span className="inline-flex min-h-8 w-fit items-center justify-center rounded-full bg-[rgba(171,230,240,0.16)] px-3 text-[0.78rem] font-semibold uppercase tracking-[0.04em] text-[#d8f5fb]">
            {formatAuthRole(session.user.role)}
          </span>
        </div>
        <button
          data-testid="workspace-logout-button"
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/14 bg-white/8 px-4 text-white font-semibold transition hover:-translate-y-px hover:border-white/18 hover:bg-white/12"
          type="button"
          onClick={() => {
            onClose();
            void onLogout();
          }}
        >
          Cerrar sesion
        </button>
      </div>
    </aside>
  );
}
