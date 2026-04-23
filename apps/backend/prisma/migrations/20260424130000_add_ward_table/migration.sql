-- Etapa 2 del backlog de normalización: mover los strings ward repetidos en
-- StaffMember y StaffFacilityAssignment a una tabla Ward única por facility.

-- 1. Tabla Ward
CREATE TABLE "Ward" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "facilityId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT NOT NULL,
  "deletedAt" TIMESTAMP(3),
  "deletedBy" TEXT,
  CONSTRAINT "Ward_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Ward_facilityId_code_key"
  ON "Ward"("facilityId", "code");
CREATE INDEX "Ward_facilityId_deletedAt_idx"
  ON "Ward"("facilityId", "deletedAt");
CREATE INDEX "Ward_deletedAt_idx" ON "Ward"("deletedAt");

ALTER TABLE "Ward"
  ADD CONSTRAINT "Ward_facilityId_fkey"
  FOREIGN KEY ("facilityId") REFERENCES "Facility"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- 2. Sembrar Wards a partir de StaffFacilityAssignment.ward (tiene facilityId).
--    "code" se deriva normalizando el nombre a lowercase/kebab.
INSERT INTO "Ward" (
  "facilityId", "code", "name",
  "createdAt", "createdBy", "updatedAt", "updatedBy"
)
SELECT DISTINCT
  sfa."facilityId",
  LOWER(REGEXP_REPLACE(sfa."ward", '\s+', '-', 'g')),
  sfa."ward",
  NOW(), 'migration', NOW(), 'migration'
FROM "StaffFacilityAssignment" sfa
WHERE sfa."ward" IS NOT NULL
  AND TRIM(sfa."ward") <> ''
ON CONFLICT ("facilityId", "code") DO NOTHING;

-- 3. Completar con wards que aparezcan en StaffMember pero no tengan
--    assignment correspondiente. Resolver facilityId via el primer assignment
--    del staff (si existe); si el staff no tiene assignment, se ignora
--    (wardId queda NULL más abajo).
INSERT INTO "Ward" (
  "facilityId", "code", "name",
  "createdAt", "createdBy", "updatedAt", "updatedBy"
)
SELECT DISTINCT
  sfa."facilityId",
  LOWER(REGEXP_REPLACE(sm."ward", '\s+', '-', 'g')),
  sm."ward",
  NOW(), 'migration', NOW(), 'migration'
FROM "StaffMember" sm
JOIN LATERAL (
  SELECT "facilityId"
  FROM "StaffFacilityAssignment" sfax
  WHERE sfax."staffId" = sm."id"
  ORDER BY sfax."createdAt"
  LIMIT 1
) sfa ON TRUE
WHERE sm."ward" IS NOT NULL
  AND TRIM(sm."ward") <> ''
ON CONFLICT ("facilityId", "code") DO NOTHING;

-- 4. Agregar columnas nullable wardId y backfillear.
ALTER TABLE "StaffFacilityAssignment" ADD COLUMN "wardId" UUID;
ALTER TABLE "StaffMember" ADD COLUMN "wardId" UUID;

UPDATE "StaffFacilityAssignment" sfa
SET "wardId" = w."id"
FROM "Ward" w
WHERE w."facilityId" = sfa."facilityId"
  AND w."name" = sfa."ward";

UPDATE "StaffMember" sm
SET "wardId" = w."id"
FROM "StaffFacilityAssignment" sfa, "Ward" w
WHERE sfa."staffId" = sm."id"
  AND w."facilityId" = sfa."facilityId"
  AND w."name" = sm."ward";

-- 5. FKs + índices
ALTER TABLE "StaffFacilityAssignment"
  ADD CONSTRAINT "StaffFacilityAssignment_wardId_fkey"
  FOREIGN KEY ("wardId") REFERENCES "Ward"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "StaffFacilityAssignment_wardId_idx"
  ON "StaffFacilityAssignment"("wardId");

ALTER TABLE "StaffMember"
  ADD CONSTRAINT "StaffMember_wardId_fkey"
  FOREIGN KEY ("wardId") REFERENCES "Ward"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "StaffMember_wardId_idx"
  ON "StaffMember"("wardId");

-- 6. Drop columnas string viejas.
ALTER TABLE "StaffMember" DROP COLUMN "ward";
ALTER TABLE "StaffFacilityAssignment" DROP COLUMN "ward";
