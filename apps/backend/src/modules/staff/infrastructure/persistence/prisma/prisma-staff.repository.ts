import { Inject, Injectable } from '@nestjs/common';

import type { StaffMember as DomainStaffMember } from '@gentrix/domain-staff';
import { Prisma } from '@prisma/client';
import { toIsoDateString } from '@gentrix/shared-utils';

import { PrismaService } from '../../../../../infrastructure/prisma/prisma.service';
import type { StaffRepository } from '../../../domain/repositories/staff.repository';

type StaffRecord = Prisma.StaffMemberGetPayload<{
  include: {
    assignments: {
      include: {
        facility: true;
      };
    };
  };
}>;

const staffRoles = new Set<DomainStaffMember['role']>([
  'nurse',
  'doctor',
  'caregiver',
  'coordinator',
]);
const shiftWindows = new Set<DomainStaffMember['shift']>([
  'morning',
  'afternoon',
  'night',
]);

@Injectable()
export class PrismaStaffRepository implements StaffRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async list(organizationId?: string): Promise<DomainStaffMember[]> {
    const staff = await this.prisma.staffMember.findMany({
      where: {
        deletedAt: null,
        organizationId: organizationId ?? undefined,
      },
      include: {
        assignments: {
          where: {
            deletedAt: null,
            status: 'active',
            facility: {
              deletedAt: null,
              status: 'active',
            },
          },
          include: {
            facility: true,
          },
          orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return staff.map(mapStaffRecord);
  }
}

function mapStaffRecord(record: StaffRecord): DomainStaffMember {
  const primaryAssignment = record.assignments[0];

  return {
    id: record.id as DomainStaffMember['id'],
    organizationId: record.organizationId as DomainStaffMember['organizationId'],
    firstName: record.firstName,
    lastName: record.lastName,
    role: normalizeStaffRole(record.role),
    ward: primaryAssignment?.ward ?? record.ward,
    shift: normalizeShiftWindow(primaryAssignment?.shift ?? record.shift),
    status: normalizeEntityStatus(record.status),
    startDate: toIsoDateString(record.startDate),
    audit: {
      createdAt: toIsoDateString(record.createdAt),
      updatedAt: toIsoDateString(record.updatedAt),
      createdBy: record.createdBy,
      updatedBy: record.updatedBy,
      deletedAt: record.deletedAt ? toIsoDateString(record.deletedAt) : undefined,
      deletedBy: record.deletedBy ?? undefined,
    },
  };
}

function normalizeStaffRole(value: string): DomainStaffMember['role'] {
  return staffRoles.has(value as DomainStaffMember['role'])
    ? (value as DomainStaffMember['role'])
    : 'caregiver';
}

function normalizeShiftWindow(value: string): DomainStaffMember['shift'] {
  return shiftWindows.has(value as DomainStaffMember['shift'])
    ? (value as DomainStaffMember['shift'])
    : 'morning';
}

function normalizeEntityStatus(
  value: string,
): DomainStaffMember['status'] {
  return value === 'inactive' || value === 'archived' ? value : 'active';
}
