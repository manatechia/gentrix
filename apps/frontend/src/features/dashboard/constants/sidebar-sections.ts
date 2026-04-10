import type { AuthRole } from '@gentrix/shared-types';

export const sidebarSections = [
  {
    testId: 'workspace-sidebar-link-dashboard',
    label: 'Resumen',
    meta: 'tablero general',
    badge: 'RS',
    path: '/dashboard',
    end: true,
  },
  {
    testId: 'workspace-sidebar-link-residents',
    label: 'Residentes',
    meta: 'seguimiento y altas',
    badge: 'RE',
    path: '/residentes',
    end: false,
  },
  {
    testId: 'workspace-sidebar-link-users',
    label: 'Personal',
    meta: 'cobertura del turno',
    badge: 'PE',
    path: '/personal',
    end: false,
    visibleTo: ['admin'] satisfies AuthRole[],
  },
  {
    testId: 'workspace-sidebar-link-handoff',
    label: 'Pase',
    meta: 'turno y pendientes',
    badge: 'HO',
    path: '/handoff',
    end: true,
    hiddenInMenu: true,
  },
  {
    testId: 'workspace-sidebar-link-medication',
    label: 'Medicacion',
    meta: 'agenda clinica',
    badge: 'MD',
    path: '/medicacion',
    end: false,
    hiddenInMenu: true,
  },
] as const;
