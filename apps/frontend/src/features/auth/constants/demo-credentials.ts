import type { AuthLoginRequest } from '@gentrix/shared-types';

export interface DemoAccessOption {
  id: 'admin' | 'staff';
  label: string;
  description: string;
  capabilities: string;
  credentials: AuthLoginRequest;
}

export const demoAccessOptions: DemoAccessOption[] = [
  {
    id: 'admin',
    label: 'Administrador',
    description:
      'Acceso completo a residentes, medicacion y configuracion operativa.',
    capabilities: 'Puede crear y editar fichas, ordenes y vistas de gestion.',
    credentials: {
      email: 'admin@gentrix.local',
      password: 'gentrix123',
    },
  },
  {
    id: 'staff',
    label: 'Personal',
    description: 'Vista operativa para enfermeria y cuidadores del turno.',
    capabilities:
      'Puede consultar residentes y registrar ejecuciones de medicacion.',
    credentials: {
      email: 'ana.gomez@gentrix.local',
      password: 'gentrix123',
    },
  },
];

export const demoCredentials: AuthLoginRequest = {
  ...demoAccessOptions[0].credentials,
};
