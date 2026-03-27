CREATE TABLE "StaffFacilityAssignment" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "staffId" UUID NOT NULL,
  "facilityId" UUID NOT NULL,
  "assignmentRole" TEXT,
  "ward" TEXT,
  "shift" TEXT,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3),
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT NOT NULL,
  "deletedAt" TIMESTAMP(3),
  "deletedBy" TEXT,
  CONSTRAINT "StaffFacilityAssignment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "StaffMember"
ADD COLUMN "organizationId" UUID;

UPDATE "StaffMember"
SET "organizationId" = '10000000-0000-4000-8000-000000000001'
WHERE "organizationId" IS NULL;

INSERT INTO "StaffFacilityAssignment" (
  "staffId",
  "facilityId",
  "assignmentRole",
  "ward",
  "shift",
  "startDate",
  "status",
  "createdAt",
  "createdBy",
  "updatedAt",
  "updatedBy"
)
SELECT
  "id",
  '10000000-0000-4000-8000-000000000002',
  "role",
  "ward",
  "shift",
  "startDate",
  CASE WHEN "deletedAt" IS NULL THEN "status" ELSE 'inactive' END,
  "createdAt",
  "createdBy",
  "updatedAt",
  "updatedBy"
FROM "StaffMember"
WHERE "deletedAt" IS NULL;

ALTER TABLE "StaffMember"
ALTER COLUMN "organizationId" SET NOT NULL;

CREATE INDEX "StaffMember_organizationId_deletedAt_idx"
ON "StaffMember"("organizationId", "deletedAt");

CREATE INDEX "StaffFacilityAssignment_staffId_status_idx"
ON "StaffFacilityAssignment"("staffId", "status");

CREATE INDEX "StaffFacilityAssignment_facilityId_status_idx"
ON "StaffFacilityAssignment"("facilityId", "status");

CREATE INDEX "StaffFacilityAssignment_deletedAt_idx"
ON "StaffFacilityAssignment"("deletedAt");

ALTER TABLE "StaffMember"
ADD CONSTRAINT "StaffMember_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StaffFacilityAssignment"
ADD CONSTRAINT "StaffFacilityAssignment_staffId_fkey"
FOREIGN KEY ("staffId") REFERENCES "StaffMember"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StaffFacilityAssignment"
ADD CONSTRAINT "StaffFacilityAssignment_facilityId_fkey"
FOREIGN KEY ("facilityId") REFERENCES "Facility"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
