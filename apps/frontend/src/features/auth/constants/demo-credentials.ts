import type { AuthLoginRequest } from '@gentrix/shared-types';

export interface DemoAccessOption {
  id: 'admin' | 'health-director' | 'nurse';
  label: string;
  description: string;
  capabilities: string;
  credentials: AuthLoginRequest;
}

export const demoAccessOptions: DemoAccessOption[] = [
  {
    id: 'admin',
    label: 'Admin',
    description:
      'Acceso completo a residentes, medicacion y configuracion operativa.',
    capabilities: 'Puede crear y editar fichas, ordenes y vistas de gestion.',
    credentials: {
      email: 'admin@gentrix.local',
      password: 'gentrix123',
    },
  },
  {
    id: 'health-director',
    label: 'Director de salud',
    description: 'Supervisa la operacion clinica y el seguimiento de residentes.',
    capabilities:
      'Puede editar fichas operativas y medicacion, pero no administrar usuarios.',
    credentials: {
      email: 'maria.lopez@gentrix.local',
      password: 'gentrix123',
    },
  },
  {
    id: 'nurse',
    label: 'Enfermeras/os',
    description: 'Vista operativa para registrar el seguimiento del turno.',
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
