import type {
  AuditTrail,
  EntityId,
  EntityStatus,
  IsoDateString,
} from '@gentrix/shared-types';
import { createEntityId, toIsoDateString } from '@gentrix/shared-utils';

export type StaffRole = 'nurse' | 'doctor' | 'caregiver' | 'coordinator';

export type ShiftWindow = 'morning' | 'afternoon' | 'night';

export interface StaffMember {
  id: EntityId;
  organizationId: EntityId;
  firstName: string;
  lastName: string;
  role: StaffRole;
  ward: string;
  shift: ShiftWindow;
  status: EntityStatus;
  startDate: IsoDateString;
  audit: AuditTrail;
}

const baseAudit: AuditTrail = {
  createdAt: toIsoDateString('2026-01-10T09:00:00.000Z'),
  updatedAt: toIsoDateString('2026-03-12T09:00:00.000Z'),
  createdBy: 'setup-script',
  updatedBy: 'setup-script',
};

const defaultOrganizationId = createEntityId('organization', 'gentrix demo');

export function createStaffSeed(
  role: StaffRole,
  overrides: Partial<StaffMember> = {},
): StaffMember {
  const memberBase: StaffMember = {
    id: createEntityId('staff', `Ana Gomez ${role} Unidad A`),
    organizationId: defaultOrganizationId,
    firstName: 'Ana',
    lastName: 'Gomez',
    role,
    ward: 'Unidad A',
    shift: 'morning',
    status: 'active',
    startDate: toIsoDateString('2025-02-01T08:00:00.000Z'),
    audit: { ...baseAudit },
    ...overrides,
  };

  const memberId =
    overrides.id ??
    createEntityId(
      'staff',
      `${memberBase.firstName} ${memberBase.lastName} ${memberBase.role} ${memberBase.ward}`,
    );

  return {
    ...memberBase,
    id: memberId,
    audit: { ...baseAudit, ...overrides.audit },
  };
}

export function formatStaffAssignment(staff: StaffMember): string {
  return `${staff.role} - ${staff.ward} - ${staff.shift}`;
}
