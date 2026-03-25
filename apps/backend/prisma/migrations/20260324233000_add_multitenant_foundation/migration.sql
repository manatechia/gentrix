CREATE TABLE "Organization" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "slug" TEXT NOT NULL,
  "legalName" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "timezone" TEXT NOT NULL,
  "defaultLocale" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT NOT NULL,
  "deletedAt" TIMESTAMP(3),
  "deletedBy" TEXT,
  CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Facility" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "address" JSONB,
  "phone" TEXT,
  "email" TEXT,
  "capacity" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT NOT NULL,
  "deletedAt" TIMESTAMP(3),
  "deletedBy" TEXT,
  CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrganizationMembership" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "roleCode" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "joinedAt" TIMESTAMP(3) NOT NULL,
  "leftAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT NOT NULL,
  "deletedAt" TIMESTAMP(3),
  "deletedBy" TEXT,
  CONSTRAINT "OrganizationMembership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MembershipFacilityScope" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "membershipId" UUID NOT NULL,
  "facilityId" UUID NOT NULL,
  "scopeType" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT NOT NULL,
  CONSTRAINT "MembershipFacilityScope_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "User"
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';

ALTER TABLE "Session"
ADD COLUMN "activeOrganizationId" UUID,
ADD COLUMN "activeFacilityId" UUID,
ADD COLUMN "lastSeenAt" TIMESTAMP(3);

ALTER TABLE "Resident"
ADD COLUMN "organizationId" UUID,
ADD COLUMN "facilityId" UUID;

ALTER TABLE "ClinicalHistoryEvent"
ADD COLUMN "organizationId" UUID,
ADD COLUMN "facilityId" UUID;

ALTER TABLE "MedicationOrder"
ADD COLUMN "organizationId" UUID,
ADD COLUMN "facilityId" UUID;

INSERT INTO "Organization" (
  "id",
  "slug",
  "legalName",
  "displayName",
  "status",
  "timezone",
  "defaultLocale",
  "createdAt",
  "createdBy",
  "updatedAt",
  "updatedBy"
)
VALUES (
  '10000000-0000-4000-8000-000000000001',
  'gentrix-default',
  'Gentrix Default Organization',
  'Gentrix Default',
  'active',
  'America/Argentina/Buenos_Aires',
  'es-AR',
  NOW(),
  'migration',
  NOW(),
  'migration'
);

INSERT INTO "Facility" (
  "id",
  "organizationId",
  "code",
  "name",
  "status",
  "address",
  "createdAt",
  "createdBy",
  "updatedAt",
  "updatedBy"
)
VALUES (
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000001',
  'central',
  'Residencia Central',
  'active',
  '{"city":"Buenos Aires","state":"CABA"}'::jsonb,
  NOW(),
  'migration',
  NOW(),
  'migration'
);

INSERT INTO "OrganizationMembership" (
  "organizationId",
  "userId",
  "roleCode",
  "status",
  "isDefault",
  "joinedAt",
  "createdAt",
  "createdBy",
  "updatedAt",
  "updatedBy"
)
SELECT
  '10000000-0000-4000-8000-000000000001',
  "id",
  "role",
  'active',
  true,
  COALESCE("createdAt", NOW()),
  NOW(),
  'migration',
  NOW(),
  'migration'
FROM "User"
WHERE "deletedAt" IS NULL;

INSERT INTO "MembershipFacilityScope" (
  "membershipId",
  "facilityId",
  "scopeType",
  "createdAt",
  "createdBy",
  "updatedAt",
  "updatedBy"
)
SELECT
  "id",
  '10000000-0000-4000-8000-000000000002',
  'assigned',
  NOW(),
  'migration',
  NOW(),
  'migration'
FROM "OrganizationMembership";

UPDATE "Session"
SET
  "activeOrganizationId" = '10000000-0000-4000-8000-000000000001',
  "activeFacilityId" = '10000000-0000-4000-8000-000000000002',
  "lastSeenAt" = COALESCE("updatedAt", NOW())
WHERE "activeOrganizationId" IS NULL;

UPDATE "Resident"
SET
  "organizationId" = '10000000-0000-4000-8000-000000000001',
  "facilityId" = '10000000-0000-4000-8000-000000000002'
WHERE "organizationId" IS NULL
   OR "facilityId" IS NULL;

UPDATE "ClinicalHistoryEvent" AS "event"
SET
  "organizationId" = "resident"."organizationId",
  "facilityId" = "resident"."facilityId"
FROM "Resident" AS "resident"
WHERE "resident"."id" = "event"."residentId"
  AND ("event"."organizationId" IS NULL OR "event"."facilityId" IS NULL);

UPDATE "MedicationOrder" AS "order"
SET
  "organizationId" = "resident"."organizationId",
  "facilityId" = "resident"."facilityId"
FROM "Resident" AS "resident"
WHERE "resident"."id" = "order"."residentId"
  AND ("order"."organizationId" IS NULL OR "order"."facilityId" IS NULL);

ALTER TABLE "Session"
ALTER COLUMN "activeOrganizationId" SET NOT NULL;

ALTER TABLE "Resident"
ALTER COLUMN "organizationId" SET NOT NULL,
ALTER COLUMN "facilityId" SET NOT NULL;

ALTER TABLE "ClinicalHistoryEvent"
ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "MedicationOrder"
ALTER COLUMN "organizationId" SET NOT NULL,
ALTER COLUMN "facilityId" SET NOT NULL;

CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE INDEX "Organization_deletedAt_idx" ON "Organization"("deletedAt");

CREATE UNIQUE INDEX "Facility_organizationId_code_key"
ON "Facility"("organizationId", "code");
CREATE INDEX "Facility_organizationId_deletedAt_idx"
ON "Facility"("organizationId", "deletedAt");
CREATE INDEX "Facility_deletedAt_idx" ON "Facility"("deletedAt");

CREATE UNIQUE INDEX "OrganizationMembership_organizationId_userId_key"
ON "OrganizationMembership"("organizationId", "userId");
CREATE INDEX "OrganizationMembership_userId_status_idx"
ON "OrganizationMembership"("userId", "status");
CREATE INDEX "OrganizationMembership_organizationId_status_idx"
ON "OrganizationMembership"("organizationId", "status");
CREATE INDEX "OrganizationMembership_deletedAt_idx"
ON "OrganizationMembership"("deletedAt");

CREATE UNIQUE INDEX "MembershipFacilityScope_membershipId_facilityId_key"
ON "MembershipFacilityScope"("membershipId", "facilityId");
CREATE INDEX "MembershipFacilityScope_facilityId_idx"
ON "MembershipFacilityScope"("facilityId");

CREATE INDEX "Session_activeOrganizationId_idx"
ON "Session"("activeOrganizationId");

CREATE INDEX "Resident_organizationId_deletedAt_idx"
ON "Resident"("organizationId", "deletedAt");
CREATE INDEX "Resident_organizationId_facilityId_deletedAt_idx"
ON "Resident"("organizationId", "facilityId", "deletedAt");

DROP INDEX "ClinicalHistoryEvent_residentId_occurredAt_idx";
CREATE INDEX "ClinicalHistoryEvent_organizationId_residentId_occurredAt_idx"
ON "ClinicalHistoryEvent"("organizationId", "residentId", "occurredAt");
CREATE INDEX "ClinicalHistoryEvent_facilityId_occurredAt_idx"
ON "ClinicalHistoryEvent"("facilityId", "occurredAt");

CREATE INDEX "MedicationOrder_organizationId_deletedAt_idx"
ON "MedicationOrder"("organizationId", "deletedAt");
CREATE INDEX "MedicationOrder_organizationId_facilityId_deletedAt_idx"
ON "MedicationOrder"("organizationId", "facilityId", "deletedAt");

ALTER TABLE "Facility"
ADD CONSTRAINT "Facility_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OrganizationMembership"
ADD CONSTRAINT "OrganizationMembership_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OrganizationMembership"
ADD CONSTRAINT "OrganizationMembership_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MembershipFacilityScope"
ADD CONSTRAINT "MembershipFacilityScope_membershipId_fkey"
FOREIGN KEY ("membershipId") REFERENCES "OrganizationMembership"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MembershipFacilityScope"
ADD CONSTRAINT "MembershipFacilityScope_facilityId_fkey"
FOREIGN KEY ("facilityId") REFERENCES "Facility"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Session"
ADD CONSTRAINT "Session_activeOrganizationId_fkey"
FOREIGN KEY ("activeOrganizationId") REFERENCES "Organization"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Session"
ADD CONSTRAINT "Session_activeFacilityId_fkey"
FOREIGN KEY ("activeFacilityId") REFERENCES "Facility"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Resident"
ADD CONSTRAINT "Resident_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Resident"
ADD CONSTRAINT "Resident_facilityId_fkey"
FOREIGN KEY ("facilityId") REFERENCES "Facility"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ClinicalHistoryEvent"
ADD CONSTRAINT "ClinicalHistoryEvent_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ClinicalHistoryEvent"
ADD CONSTRAINT "ClinicalHistoryEvent_facilityId_fkey"
FOREIGN KEY ("facilityId") REFERENCES "Facility"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MedicationOrder"
ADD CONSTRAINT "MedicationOrder_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MedicationOrder"
ADD CONSTRAINT "MedicationOrder_facilityId_fkey"
FOREIGN KEY ("facilityId") REFERENCES "Facility"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
