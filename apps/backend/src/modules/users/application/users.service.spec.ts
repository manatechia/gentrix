import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';

import type { UserOverview } from '@gentrix/shared-types';

import { verifyPassword } from '../../../common/auth/password-hash';
import { validatePasswordPolicy } from '../../../common/auth/password-policy';
import type {
  PasswordResetAuditEntry,
  PasswordResetAuditRecord,
  PasswordResetAuditRepository,
} from '../domain/repositories/password-reset-audit.repository';
import type {
  CompleteForcedChangeInput,
  PersistedUserCreateInput,
  ResetPasswordInput,
  UserPasswordRecord,
  UserRepository,
} from '../domain/repositories/user.repository';
import { UsersService } from './users.service';

class InMemoryUserRepository implements UserRepository {
  readonly passwords = new Map<string, UserPasswordRecord>();
  readonly users = new Map<string, UserOverview>();
  lastReset: ResetPasswordInput | null = null;
  lastForcedChange: CompleteForcedChangeInput | null = null;

  seed(user: UserOverview, password: string, organizationId: string): void {
    this.users.set(user.id, user);
    this.passwords.set(user.id, {
      id: user.id,
      organizationId,
      password,
      forcePasswordChange: user.forcePasswordChange,
      passwordChangedAt: user.passwordChangedAt,
    });
  }

  async list(): Promise<UserOverview[]> {
    return Array.from(this.users.values());
  }

  async findById(userId: string): Promise<UserOverview | null> {
    return this.users.get(userId) ?? null;
  }

  async findPasswordRecord(userId: string): Promise<UserPasswordRecord | null> {
    return this.passwords.get(userId) ?? null;
  }

  async create(input: PersistedUserCreateInput): Promise<UserOverview> {
    const record: UserOverview = {
      id: `user-${this.users.size + 1}` as UserOverview['id'],
      fullName: input.fullName,
      email: input.email,
      role: input.role,
      status: 'active',
      forcePasswordChange: true,
      passwordChangedAt: null,
    };
    this.seed(record, input.password, input.organizationId);
    return record;
  }

  async resetPassword(input: ResetPasswordInput): Promise<UserOverview> {
    this.lastReset = input;
    const current = this.users.get(input.userId);
    if (!current) {
      throw new NotFoundException('missing user');
    }
    const updated: UserOverview = {
      ...current,
      forcePasswordChange: true,
      passwordChangedAt: null,
    };
    this.users.set(input.userId, updated);
    this.passwords.set(input.userId, {
      id: input.userId,
      organizationId: input.organizationId,
      password: input.newPassword,
      forcePasswordChange: true,
      passwordChangedAt: null,
    });
    return updated;
  }

  async completeForcedChange(input: CompleteForcedChangeInput): Promise<void> {
    this.lastForcedChange = input;
    const record = this.passwords.get(input.userId);
    if (!record) return;
    this.passwords.set(input.userId, {
      ...record,
      password: input.newPassword,
      forcePasswordChange: false,
      passwordChangedAt: new Date().toISOString() as UserPasswordRecord['passwordChangedAt'],
    });
    const overview = this.users.get(input.userId);
    if (overview) {
      this.users.set(input.userId, {
        ...overview,
        forcePasswordChange: false,
      });
    }
  }
}

class InMemoryPasswordResetAuditRepository
  implements PasswordResetAuditRepository
{
  readonly entries: PasswordResetAuditEntry[] = [];

  async record(entry: PasswordResetAuditRecord): Promise<PasswordResetAuditEntry> {
    const created: PasswordResetAuditEntry = {
      ...entry,
      reason: entry.reason ?? null,
      ipAddress: entry.ipAddress ?? null,
      userAgent: entry.userAgent ?? null,
      id: `audit-${this.entries.length + 1}`,
      occurredAtIso: entry.occurredAt.toISOString() as PasswordResetAuditEntry['occurredAtIso'],
    };
    this.entries.push(created);
    return created;
  }

  async listForUser(
    targetUserId: string,
  ): Promise<PasswordResetAuditEntry[]> {
    return this.entries.filter((entry) => entry.targetUserId === targetUserId);
  }
}

const ORG_ID = 'org-1';

function buildTargetUser(
  overrides: Partial<UserOverview> = {},
): UserOverview {
  return {
    id: 'user-target' as UserOverview['id'],
    fullName: 'Ana Gomez',
    email: 'ana@example.com',
    role: 'nurse',
    status: 'active',
    forcePasswordChange: false,
    passwordChangedAt: null,
    ...overrides,
  };
}

describe('UsersService - password reset', () => {
  let users: InMemoryUserRepository;
  let audits: InMemoryPasswordResetAuditRepository;
  let service: UsersService;

  beforeEach(() => {
    users = new InMemoryUserRepository();
    audits = new InMemoryPasswordResetAuditRepository();
    service = new UsersService(users, audits);
  });

  it('generates a policy-compliant temporary password and records an audit entry', async () => {
    users.seed(buildTargetUser(), 'old-pw', ORG_ID);

    const result = await service.resetPassword('user-target', {
      userId: 'admin-1',
      label: 'Sofia Quiroga',
      organizationId: ORG_ID,
    });

    expect(result.temporaryPassword).toBeTruthy();
    expect(validatePasswordPolicy(result.temporaryPassword)).toEqual([]);
    expect(result.forcePasswordChange).toBe(true);
    // Persisted row must be hashed (not the plaintext we handed to the admin)
    // but the hash must still verify against the temporary password.
    const stored = users.passwords.get('user-target')?.password ?? '';
    expect(stored).not.toBe(result.temporaryPassword);
    expect(stored.startsWith('scrypt$')).toBe(true);
    const verified = await verifyPassword(result.temporaryPassword, stored);
    expect(verified.matches).toBe(true);
    expect(users.users.get('user-target')?.forcePasswordChange).toBe(true);
    expect(audits.entries).toHaveLength(1);
    expect(audits.entries[0]).toMatchObject({
      organizationId: ORG_ID,
      adminUserId: 'admin-1',
      targetUserId: 'user-target',
      action: 'admin-reset',
      result: 'success',
    });
  });

  it('refuses to reset an admin from the admin panel', async () => {
    users.seed(buildTargetUser({ role: 'admin' }), 'old-pw', ORG_ID);

    await expect(
      service.resetPassword('user-target', {
        userId: 'admin-1',
        label: 'Sofia Quiroga',
        organizationId: ORG_ID,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(audits.entries).toHaveLength(0);
  });

  it('refuses self-reset from the admin panel', async () => {
    users.seed(buildTargetUser({ id: 'admin-1' as UserOverview['id'] }), 'x', ORG_ID);

    await expect(
      service.resetPassword('admin-1', {
        userId: 'admin-1',
        label: 'Self',
        organizationId: ORG_ID,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('errors when the target user does not exist in the organization', async () => {
    await expect(
      service.resetPassword('missing', {
        userId: 'admin-1',
        label: 'Sofia',
        organizationId: ORG_ID,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('UsersService - completeForcedChange', () => {
  let users: InMemoryUserRepository;
  let audits: InMemoryPasswordResetAuditRepository;
  let service: UsersService;

  beforeEach(() => {
    users = new InMemoryUserRepository();
    audits = new InMemoryPasswordResetAuditRepository();
    service = new UsersService(users, audits);
  });

  it('rejects mismatched confirmation and audits the failure', async () => {
    users.seed(
      buildTargetUser({ forcePasswordChange: true }),
      'Old!Pass1',
      ORG_ID,
    );

    await expect(
      service.completeForcedChange(
        { userId: 'user-target', label: 'Ana', organizationId: ORG_ID },
        'Old!Pass1',
        'NewPass!1',
        'Mismatch!1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(audits.entries).toHaveLength(1);
    expect(audits.entries[0]).toMatchObject({
      action: 'forced-change-failed',
      result: 'failure',
      reason: 'confirmation-mismatch',
    });
  });

  it('rejects passwords that fail the policy', async () => {
    users.seed(
      buildTargetUser({ forcePasswordChange: true }),
      'Old!Pass1',
      ORG_ID,
    );

    await expect(
      service.completeForcedChange(
        { userId: 'user-target', label: 'Ana', organizationId: ORG_ID },
        'Old!Pass1',
        'weak',
        'weak',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(audits.entries[0]?.reason).toBe('policy-violation');
  });

  it('rejects wrong current password', async () => {
    users.seed(
      buildTargetUser({ forcePasswordChange: true }),
      'RealPass!1',
      ORG_ID,
    );

    await expect(
      service.completeForcedChange(
        { userId: 'user-target', label: 'Ana', organizationId: ORG_ID },
        'WrongPass!1',
        'NewPass!1',
        'NewPass!1',
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(audits.entries[0]?.reason).toBe('invalid-current-password');
  });

  it('rejects when the new password equals the current one', async () => {
    users.seed(
      buildTargetUser({ forcePasswordChange: true }),
      'Same!Pass1',
      ORG_ID,
    );

    await expect(
      service.completeForcedChange(
        { userId: 'user-target', label: 'Ana', organizationId: ORG_ID },
        'Same!Pass1',
        'Same!Pass1',
        'Same!Pass1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(audits.entries[0]?.reason).toBe('same-as-current');
  });

  it('clears the forcePasswordChange flag, updates the password, and audits success', async () => {
    users.seed(
      buildTargetUser({ forcePasswordChange: true }),
      'Old!Pass1',
      ORG_ID,
    );

    await service.completeForcedChange(
      { userId: 'user-target', label: 'Ana', organizationId: ORG_ID },
      'Old!Pass1',
      'NewPass!2',
      'NewPass!2',
    );

    // The repo receives the already-hashed value (so the plaintext never
    // lands on disk), and the stored row verifies against the new plaintext.
    expect(users.lastForcedChange?.userId).toBe('user-target');
    expect(users.lastForcedChange?.newPassword.startsWith('scrypt$')).toBe(true);
    expect(users.passwords.get('user-target')?.forcePasswordChange).toBe(false);
    const stored = users.passwords.get('user-target')?.password ?? '';
    expect(stored).not.toBe('NewPass!2');
    expect(stored.startsWith('scrypt$')).toBe(true);
    const verified = await verifyPassword('NewPass!2', stored);
    expect(verified.matches).toBe(true);
    expect(audits.entries).toHaveLength(1);
    expect(audits.entries[0]).toMatchObject({
      action: 'forced-change-completed',
      result: 'success',
      targetUserId: 'user-target',
    });
  });
});
