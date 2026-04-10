import type { AuthRole } from '@gentrix/shared-types';

const managementRoles = new Set<AuthRole>(['admin', 'health-director']);

export function isStaffRole(role: AuthRole): boolean {
  return role === 'nurse' || role === 'assistant' || role === 'external';
}

export function canManageResidents(role: AuthRole): boolean {
  return managementRoles.has(role);
}

export function canManageMedicationOrders(role: AuthRole): boolean {
  return managementRoles.has(role);
}

export function canManageStaffSchedules(role: AuthRole): boolean {
  return managementRoles.has(role);
}

export function canManageUsers(role: AuthRole): boolean {
  return role === 'admin';
}

export function canViewResidentAdministrativeData(role: AuthRole): boolean {
  return managementRoles.has(role);
}
