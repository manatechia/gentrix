import { ForbiddenException } from '@nestjs/common';

import type { AuthRole } from '@gentrix/shared-types';

const managementRoles = new Set<AuthRole>(['admin', 'health-director']);

export function canManageResidentRecords(role: AuthRole): boolean {
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

export function assertCanManageResidentRecords(role: AuthRole): void {
  if (!canManageResidentRecords(role)) {
    throw new ForbiddenException(
      'El personal no puede crear ni editar fichas de residentes.',
    );
  }
}

export function assertCanManageMedicationOrders(role: AuthRole): void {
  if (!canManageMedicationOrders(role)) {
    throw new ForbiddenException(
      'El personal no puede crear ni editar ordenes de medicacion.',
    );
  }
}

export function assertCanManageStaffSchedules(role: AuthRole): void {
  if (!canManageStaffSchedules(role)) {
    throw new ForbiddenException(
      'El personal no puede crear ni editar horarios del equipo.',
    );
  }
}

export function assertCanManageUsers(role: AuthRole): void {
  if (!canManageUsers(role)) {
    throw new ForbiddenException(
      'Solo administracion puede gestionar usuarios de la plataforma.',
    );
  }
}
