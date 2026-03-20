import { Injectable } from '@nestjs/common';

import { seedUsers } from '../../../../../common/persistence/in-memory-seed';
import type {
  AuthUserRepository,
  StoredAuthUser,
} from '../../../domain/repositories/auth-user.repository';

@Injectable()
export class InMemoryAuthUserRepository implements AuthUserRepository {
  private readonly users: StoredAuthUser[] = seedUsers.map((user) => ({ ...user }));

  async findByEmail(email: string): Promise<StoredAuthUser | null> {
    const normalizedEmail = email.trim().toLowerCase();
    return (
      this.users.find((candidate) => candidate.email === normalizedEmail) ?? null
    );
  }
}
