import { Injectable } from '@nestjs/common';

import type {
  AuthSessionRepository,
  AuthSessionWithToken,
} from '../../../domain/repositories/auth-session.repository';

@Injectable()
export class InMemoryAuthSessionRepository implements AuthSessionRepository {
  private readonly sessions = new Map<string, AuthSessionWithToken>();

  async create(session: AuthSessionWithToken): Promise<void> {
    this.sessions.set(session.token, session);
  }

  async findValidByToken(
    token: string,
  ): Promise<AuthSessionWithToken | null> {
    const session = this.sessions.get(token);

    if (!session) {
      return null;
    }

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      this.sessions.delete(token);
      return null;
    }

    return session;
  }

  async delete(token: string): Promise<boolean> {
    return this.sessions.delete(token);
  }
}
