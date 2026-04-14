import type { AuthUser } from '@gentrix/shared-types';

import type { RequestWithSession } from './session.guard';

export function buildAuditActorLabel(
  user: Pick<AuthUser, 'fullName' | 'email'>,
): string {
  const fullName = user.fullName.trim();

  if (fullName.length > 0) {
    return fullName;
  }

  return user.email.trim();
}

export function getAuditActorFromRequest(request: RequestWithSession): string {
  return buildAuditActorLabel(request.authSession!.user);
}
