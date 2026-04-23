-- Consolidación de identidades: `StaffMember` y `StaffFacilityAssignment`
-- quedan deprecadas. `UserAccount` + `OrganizationMembership` pasan a ser
-- la única fuente de verdad de las personas que trabajan en una
-- organización. Prod está vacía al 2026-04-25 y los datos locales se
-- reseedean; por eso la migración es destructiva (no hay backfill).

-- 1. Tirar abajo las tablas y FKs duplicadas.
--    El orden importa: `StaffSchedule` y `StaffFacilityAssignment` apuntan
--    a `StaffMember`, así que caen primero.
DROP TABLE IF EXISTS "StaffSchedule";
DROP TABLE IF EXISTS "StaffFacilityAssignment";
DROP TABLE IF EXISTS "StaffMember";

-- 2. `OrganizationMembership` absorbe lo operativo que antes vivía en
--    StaffMember/StaffFacilityAssignment: puesto laboral, sector físico y
--    turno. `joinedAt` / `leftAt` ya cubrían el ciclo de vida laboral.
ALTER TABLE "OrganizationMembership"
  ADD COLUMN "jobTitleId" UUID,
  ADD COLUMN "wardId"     UUID,
  ADD COLUMN "shift"      TEXT;

ALTER TABLE "OrganizationMembership"
  ADD CONSTRAINT "OrganizationMembership_jobTitleId_fkey"
  FOREIGN KEY ("jobTitleId") REFERENCES "JobTitle"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OrganizationMembership"
  ADD CONSTRAINT "OrganizationMembership_wardId_fkey"
  FOREIGN KEY ("wardId") REFERENCES "Ward"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- El vocabulario de turnos se mantiene idéntico al que estaba en
-- `StaffMember.shift` (CHECK en migración 20260424110000).
ALTER TABLE "OrganizationMembership"
  ADD CONSTRAINT "OrganizationMembership_shift_check"
  CHECK ("shift" IN ('morning','afternoon','night'));

CREATE INDEX "OrganizationMembership_jobTitleId_idx"
  ON "OrganizationMembership"("jobTitleId");
CREATE INDEX "OrganizationMembership_wardId_idx"
  ON "OrganizationMembership"("wardId");

-- 3. Recrear `StaffSchedule` apuntando al membership. La tabla mantiene el
--    nombre (es "horario operativo"; el concepto sobrevive), pero la FK
--    apunta a la membresía en la org en vez de al viejo StaffMember.
CREATE TABLE "StaffSchedule" (
  "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
  "membershipId"  UUID NOT NULL,
  "weekday"       INTEGER NOT NULL,
  "startTime"     TEXT NOT NULL,
  "endTime"       TEXT NOT NULL,
  "exceptionDate" TIMESTAMP(3),
  "coverageNote"  TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL,
  "createdBy"     TEXT NOT NULL,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  "updatedBy"     TEXT NOT NULL,
  "deletedAt"     TIMESTAMP(3),
  "deletedBy"     TEXT,
  CONSTRAINT "StaffSchedule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StaffSchedule_membershipId_idx"
  ON "StaffSchedule"("membershipId");
CREATE INDEX "StaffSchedule_exceptionDate_idx"
  ON "StaffSchedule"("exceptionDate");
CREATE INDEX "StaffSchedule_deletedAt_idx"
  ON "StaffSchedule"("deletedAt");

ALTER TABLE "StaffSchedule"
  ADD CONSTRAINT "StaffSchedule_membershipId_fkey"
  FOREIGN KEY ("membershipId") REFERENCES "OrganizationMembership"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
