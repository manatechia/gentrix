import type { IsoDateString } from '@gentrix/shared-types';

export type PasswordResetAuditAction =
  | 'admin-reset'
  | 'forced-change-completed'
  | 'forced-change-failed';

export type PasswordResetAuditResult = 'success' | 'failure';

export interface PasswordResetAuditRecord {
  organizationId: string;
  adminUserId: string | null;
  targetUserId: string;
  action: PasswordResetAuditAction;
  result: PasswordResetAuditResult;
  reason?: string | null;
  occurredAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface PasswordResetAuditEntry extends PasswordResetAuditRecord {
  id: string;
  occurredAtIso: IsoDateString;
}

export interface PasswordResetAuditRepository {
  record(entry: PasswordResetAuditRecord): Promise<PasswordResetAuditEntry>;
  listForUser(targetUserId: string): Promise<PasswordResetAuditEntry[]>;
}

export const PASSWORD_RESET_AUDIT_REPOSITORY = Symbol(
  'PASSWORD_RESET_AUDIT_REPOSITORY',
);
