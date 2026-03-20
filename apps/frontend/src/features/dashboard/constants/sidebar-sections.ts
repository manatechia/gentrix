export const sidebarSections = [
  {
    label: 'Resumen',
    meta: 'tablero general',
    badge: 'RS',
    path: '/dashboard',
    end: true,
  },
  {
    label: 'Residentes',
    meta: 'seguimiento y altas',
    badge: 'RE',
    path: '/residentes',
    end: false,
  },
  { label: 'Personal', meta: 'cobertura del turno', badge: 'PE' },
  { label: 'Medicacion', meta: 'agenda clinica', badge: 'MD' },
] as const;
