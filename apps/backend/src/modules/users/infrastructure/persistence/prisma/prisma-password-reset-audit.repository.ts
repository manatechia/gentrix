import { Inject, Injectable } from '@nestjs/common';

import { toIsoDateString } from '@gentrix/shared-utils';

import { PrismaService } from '../../../../../infrastructure/prisma/prisma.service';
import type {
  PasswordResetAuditEntry,
  PasswordResetAuditRecord,
  PasswordResetAuditRepository,
} from '../../../domain/repositories/password-reset-audit.repository';

@Injectable()
export class PrismaPasswordResetAuditRepository
  implements PasswordResetAuditRepository
{
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async record(
    entry: PasswordResetAuditRecord,
  ): Promise<PasswordResetAuditEntry> {
    const created = await this.prisma.passwordResetAudit.create({
      data: {
        organizationId: entry.organizationId,
        adminUserId: entry.adminUserId,
        targetUserId: entry.targetUserId,
        action: entry.action,
        result: entry.result,
        reason: entry.reason ?? null,
        occurredAt: entry.occurredAt,
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent ?? null,
      },
    });

    return {
      id: created.id,
      organizationId: created.organizationId,
      adminUserId: created.adminUserId,
      targetUserId: created.targetUserId,
      action: created.action as PasswordResetAuditEntry['action'],
      result: created.result as PasswordResetAuditEntry['result'],
      reason: created.reason,
      occurredAt: created.occurredAt,
      occurredAtIso: toIsoDateString(created.occurredAt),
      ipAddress: created.ipAddress,
      userAgent: created.userAgent,
    };
  }

  async listForUser(targetUserId: string): Promise<PasswordResetAuditEntry[]> {
    const rows = await this.prisma.passwordResetAudit.findMany({
      where: { targetUserId },
      orderBy: { occurredAt: 'desc' },
    });

    return rows.map((row) => ({
      id: row.id,
      organizationId: row.organizationId,
      adminUserId: row.adminUserId,
      targetUserId: row.targetUserId,
      action: row.action as PasswordResetAuditEntry['action'],
      result: row.result as PasswordResetAuditEntry['result'],
      reason: row.reason,
      occurredAt: row.occurredAt,
      occurredAtIso: toIsoDateString(row.occurredAt),
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
    }));
  }
}
