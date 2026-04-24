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
      'Acceso completo a residentes, medicación y configuración operativa.',
    capabilities: 'Puede crear y editar fichas, órdenes y vistas de gestión.',
    credentials: {
      email: 'admin@gentrix.local',
      password: 'gentrix123',
    },
  },
  {
    id: 'health-director',
    label: 'Director de salud',
    description: 'Supervisa la operación clínica y el seguimiento de residentes.',
    capabilities:
      'Puede editar fichas operativas y medicación, pero no administrar usuarios.',
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
      'Puede consultar residentes y registrar ejecuciones de medicación.',
    credentials: {
      email: 'ana.gomez@gentrix.local',
      password: 'gentrix123',
    },
  },
];

export const demoCredentials: AuthLoginRequest = {
  ...demoAccessOptions[0].credentials,
};
