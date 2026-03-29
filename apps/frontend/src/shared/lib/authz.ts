import type { AuthRole } from '@gentrix/shared-types';

const managementRoles = new Set<AuthRole>(['admin', 'coordinator']);

export function isStaffRole(role: AuthRole): boolean {
  return role === 'staff';
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

export function canViewResidentAdministrativeData(role: AuthRole): boolean {
  return role !== 'staff';
}
