-- Add forced-password-change tracking to the user account.
ALTER TABLE "User"
  ADD COLUMN "forcePasswordChange" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "passwordChangedAt"  TIMESTAMP(3);

-- Any pre-existing user should be treated as already having a usable password.
UPDATE "User"
SET "passwordChangedAt" = "createdAt"
WHERE "passwordChangedAt" IS NULL;

-- Audit trail for admin-triggered password resets and forced change completions.
CREATE TABLE "PasswordResetAudit" (
  "id"             UUID         NOT NULL,
  "organizationId" UUID         NOT NULL,
  "adminUserId"    UUID,
  "targetUserId"   UUID         NOT NULL,
  "action"         TEXT         NOT NULL,
  "result"         TEXT         NOT NULL,
  "reason"         TEXT,
  "occurredAt"     TIMESTAMP(3) NOT NULL,
  "ipAddress"      TEXT,
  "userAgent"      TEXT,

  CONSTRAINT "PasswordResetAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PasswordResetAudit_organizationId_occurredAt_idx"
  ON "PasswordResetAudit" ("organizationId", "occurredAt");

CREATE INDEX "PasswordResetAudit_targetUserId_occurredAt_idx"
  ON "PasswordResetAudit" ("targetUserId", "occurredAt");

CREATE INDEX "PasswordResetAudit_adminUserId_occurredAt_idx"
  ON "PasswordResetAudit" ("adminUserId", "occurredAt");

ALTER TABLE "PasswordResetAudit"
  ADD CONSTRAINT "PasswordResetAudit_adminUserId_fkey"
  FOREIGN KEY ("adminUserId") REFERENCES "User" ("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PasswordResetAudit"
  ADD CONSTRAINT "PasswordResetAudit_targetUserId_fkey"
  FOREIGN KEY ("targetUserId") REFERENCES "User" ("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
