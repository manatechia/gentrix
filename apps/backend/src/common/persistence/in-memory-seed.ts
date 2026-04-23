import { createMedicationSeed } from '@gentrix/domain-medication';
import { createResidentSeed } from '@gentrix/domain-residents';
import type {
  AuthFacility,
  AuthOrganization,
  AuthRole,
  AuthUser,
} from '@gentrix/shared-types';
import { createEntityId } from '@gentrix/shared-utils';

export interface SeedUser extends AuthUser {
  password: string;
  activeOrganization: AuthOrganization;
  activeFacility?: AuthFacility;
}

export const seedDefaultOrganization: AuthOrganization = {
  id: createEntityId('organization', 'gentrix demo'),
  slug: 'gentrix-demo',
  displayName: 'Gentrix Demo',
};

export const seedDefaultFacility: AuthFacility = {
  id: createEntityId('facility', 'residencia central'),
  code: 'central',
  name: 'Residencia Central',
};

export const seedUsers: SeedUser[] = [
  {
    id: createEntityId('user', 'sofia quiroga'),
    fullName: 'Sofia Quiroga',
    email: 'admin@gentrix.local',
    password: 'gentrix123',
    role: 'admin' satisfies AuthRole,
    forcePasswordChange: false,
    activeOrganization: seedDefaultOrganization,
    activeFacility: seedDefaultFacility,
  },
  {
    id: createEntityId('user', 'ana gomez'),
    fullName: 'Ana Gomez',
    email: 'ana.gomez@gentrix.local',
    password: 'gentrix123',
    role: 'nurse' satisfies AuthRole,
    forcePasswordChange: false,
    activeOrganization: seedDefaultOrganization,
    activeFacility: seedDefaultFacility,
  },
  {
    id: createEntityId('user', 'maria lopez'),
    fullName: 'Maria Lopez',
    email: 'maria.lopez@gentrix.local',
    password: 'gentrix123',
    role: 'health-director' satisfies AuthRole,
    forcePasswordChange: false,
    activeOrganization: seedDefaultOrganization,
    activeFacility: seedDefaultFacility,
  },
];

export const seedResidents = [
  createResidentSeed(),
  createResidentSeed({
    firstName: 'Elena',
    lastName: 'Suarez',
    documentNumber: '28987456',
    sex: 'femenino',
    room: 'B-204',
    careLevel: 'memory-care',
  }),
  createResidentSeed({
    firstName: 'Raul',
    lastName: 'Benitez',
    documentNumber: '25440991',
    sex: 'masculino',
    room: 'C-301',
    careLevel: 'high-dependency',
    emergencyContact: {
      fullName: 'Nadia Benitez',
      relationship: 'Hija',
      phone: '+54 11 5555-0140',
    },
  }),
];

export const seedMedications = [
  createMedicationSeed(seedResidents[0].id),
  createMedicationSeed(seedResidents[1].id, {
    medicationName: 'Donepezil',
    dose: '10 mg',
    frequency: 'nightly',
    scheduleTimes: ['21:00'],
  }),
  createMedicationSeed(seedResidents[2].id, {
    medicationName: 'Enoxaparina',
    dose: '40 mg',
    route: 'subcutaneous',
    frequency: 'daily',
    scheduleTimes: ['08:00'],
  }),
];
