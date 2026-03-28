import { ForbiddenException } from '@nestjs/common';

import type { AuthRole } from '@gentrix/shared-types';

const managementRoles = new Set<AuthRole>(['admin', 'coordinator']);

export function canManageResidentRecords(role: AuthRole): boolean {
  return managementRoles.has(role);
}

export function canManageMedicationOrders(role: AuthRole): boolean {
  return managementRoles.has(role);
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
