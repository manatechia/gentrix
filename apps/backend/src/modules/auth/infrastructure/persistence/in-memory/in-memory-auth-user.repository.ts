import { Injectable } from '@nestjs/common';

import { hashPassword } from '../../../../../common/auth/password-hash';
import { seedUsers } from '../../../../../common/persistence/in-memory-seed';
import type {
  AuthUserRepository,
  StoredAuthUser,
} from '../../../domain/repositories/auth-user.repository';

@Injectable()
export class InMemoryAuthUserRepository implements AuthUserRepository {
  private readonly users: StoredAuthUser[] = seedUsers.map((user) => ({ ...user }));
  private readyPromise: Promise<void> | null = null;

  async findByEmail(email: string): Promise<StoredAuthUser | null> {
    await this.ensureHashedSeeds();
    const normalizedEmail = email.trim().toLowerCase();
    return (
      this.users.find((candidate) => candidate.email === normalizedEmail) ?? null
    );
  }

  async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    const user = this.users.find((candidate) => candidate.id === userId);
    if (user) {
      user.password = passwordHash;
    }
  }

  /**
   * Seeds are declared in plaintext for readability; we lazily replace them
   * with scrypt hashes on the first call so the in-memory repo behaves the
   * same as the Prisma one.
   */
  private ensureHashedSeeds(): Promise<void> {
    if (!this.readyPromise) {
      this.readyPromise = Promise.all(
        this.users.map(async (user) => {
          user.password = await hashPassword(user.password);
        }),
      ).then(() => undefined);
    }
    return this.readyPromise;
  }
}
