import { createMedicationSeed } from '@gentrix/domain-medication';
import { createResidentSeed } from '@gentrix/domain-residents';
import { createStaffSeed } from '@gentrix/domain-staff';
import type { AuthRole, AuthUser } from '@gentrix/shared-types';
import { createEntityId } from '@gentrix/shared-utils';

export interface SeedUser extends AuthUser {
  password: string;
}

export const seedUsers: SeedUser[] = [
  {
    id: createEntityId('user', 'sofia quiroga'),
    fullName: 'Sofia Quiroga',
    email: 'admin@gentrix.local',
    password: 'gentrix123',
    role: 'admin' satisfies AuthRole,
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

export const seedStaff = [
  createStaffSeed('nurse'),
  createStaffSeed('caregiver', {
    firstName: 'Mauro',
    lastName: 'Paz',
    ward: 'Unidad B',
    shift: 'afternoon',
  }),
  createStaffSeed('doctor', {
    firstName: 'Lucia',
    lastName: 'Mendez',
    ward: 'Consultorio',
    shift: 'morning',
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

export const dashboardAlerts = [
  '1 residente en cuidado de memoria requiere seguimiento nocturno.',
  'Medicacion inyectable programada para las 08:00 en Unidad C.',
  'Cobertura medica activa para el turno manana.',
];
