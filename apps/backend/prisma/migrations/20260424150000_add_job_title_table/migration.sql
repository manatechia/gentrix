-- Etapa 4 del backlog de normalización: consolidar `StaffMember.role` y
-- `StaffFacilityAssignment.assignmentRole` (strings duplicados) en una
-- tabla `JobTitle` por organización. Distinto de `Role` (permisos de
-- login) — esto es el puesto laboral.

-- 1. Tabla JobTitle.
CREATE TABLE "JobTitle" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT NOT NULL,
  "deletedAt" TIMESTAMP(3),
  "deletedBy" TEXT,
  CONSTRAINT "JobTitle_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "JobTitle_organizationId_code_key"
  ON "JobTitle"("organizationId", "code");
CREATE INDEX "JobTitle_organizationId_deletedAt_idx"
  ON "JobTitle"("organizationId", "deletedAt");
CREATE INDEX "JobTitle_deletedAt_idx" ON "JobTitle"("deletedAt");

ALTER TABLE "JobTitle"
  ADD CONSTRAINT "JobTitle_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- 2. Sembrar los 4 puestos canónicos por cada organización existente.
INSERT INTO "JobTitle" (
  "organizationId", "code", "displayName", "description",
  "createdAt", "createdBy", "updatedAt", "updatedBy"
)
SELECT
  o."id",
  t."code",
  t."displayName",
  t."description",
  NOW(), 'migration', NOW(), 'migration'
FROM "Organization" o
CROSS JOIN (VALUES
  ('nurse',       'Enfermería',   'Personal de enfermería operativo (administración de medicación, controles, atención directa).'),
  ('doctor',      'Médico',       'Profesional médico con rol clínico (consultas, indicaciones, seguimiento).'),
  ('caregiver',   'Cuidador',     'Personal de cuidados generales (higiene, alimentación, acompañamiento, traslados).'),
  ('coordinator', 'Coordinador',  'Coordinación de equipo, turnos y enlace entre áreas operativas.')
) AS t("code", "displayName", "description");

-- 3. Sembrar puestos adicionales si aparece algún código fuera del catálogo
--    canónico en la data existente (preserva todo valor custom).
INSERT INTO "JobTitle" (
  "organizationId", "code", "displayName", "description",
  "createdAt", "createdBy", "updatedAt", "updatedBy"
)
SELECT DISTINCT
  sm."organizationId",
  sm."role",
  sm."role",
  'Importado desde StaffMember.role legacy (migración JobTitle).',
  NOW(), 'migration', NOW(), 'migration'
FROM "StaffMember" sm
WHERE sm."role" IS NOT NULL
  AND TRIM(sm."role") <> ''
ON CONFLICT ("organizationId", "code") DO NOTHING;

-- También desde StaffFacilityAssignment.assignmentRole vía staff.organizationId.
INSERT INTO "JobTitle" (
  "organizationId", "code", "displayName", "description",
  "createdAt", "createdBy", "updatedAt", "updatedBy"
)
SELECT DISTINCT
  sm."organizationId",
  sfa."assignmentRole",
  sfa."assignmentRole",
  'Importado desde StaffFacilityAssignment.assignmentRole legacy (migración JobTitle).',
  NOW(), 'migration', NOW(), 'migration'
FROM "StaffFacilityAssignment" sfa
JOIN "StaffMember" sm ON sm."id" = sfa."staffId"
WHERE sfa."assignmentRole" IS NOT NULL
  AND TRIM(sfa."assignmentRole") <> ''
ON CONFLICT ("organizationId", "code") DO NOTHING;

-- 4. Agregar columnas nullable jobTitleId y backfillear.
ALTER TABLE "StaffMember" ADD COLUMN "jobTitleId" UUID;
ALTER TABLE "StaffFacilityAssignment" ADD COLUMN "jobTitleId" UUID;

UPDATE "StaffMember" sm
SET "jobTitleId" = jt."id"
FROM "JobTitle" jt
WHERE jt."organizationId" = sm."organizationId"
  AND jt."code" = sm."role";

UPDATE "StaffFacilityAssignment" sfa
SET "jobTitleId" = jt."id"
FROM "StaffMember" sm, "JobTitle" jt
WHERE sm."id" = sfa."staffId"
  AND jt."organizationId" = sm."organizationId"
  AND jt."code" = sfa."assignmentRole";

-- 5. FKs + índices.
ALTER TABLE "StaffMember"
  ADD CONSTRAINT "StaffMember_jobTitleId_fkey"
  FOREIGN KEY ("jobTitleId") REFERENCES "JobTitle"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "StaffMember_jobTitleId_idx"
  ON "StaffMember"("jobTitleId");

ALTER TABLE "StaffFacilityAssignment"
  ADD CONSTRAINT "StaffFacilityAssignment_jobTitleId_fkey"
  FOREIGN KEY ("jobTitleId") REFERENCES "JobTitle"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "StaffFacilityAssignment_jobTitleId_idx"
  ON "StaffFacilityAssignment"("jobTitleId");

-- 6. Drop columnas string legacy.
ALTER TABLE "StaffMember" DROP COLUMN "role";
ALTER TABLE "StaffFacilityAssignment" DROP COLUMN "assignmentRole";
