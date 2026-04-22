-- 1. Tabla Role (catálogo de roles por organización).
CREATE TABLE "Role" (
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
  CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Role_organizationId_code_key"
  ON "Role"("organizationId", "code");
CREATE INDEX "Role_organizationId_deletedAt_idx"
  ON "Role"("organizationId", "deletedAt");
CREATE INDEX "Role_deletedAt_idx" ON "Role"("deletedAt");

ALTER TABLE "Role"
  ADD CONSTRAINT "Role_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- 2. Sembrar los 5 roles canónicos por cada organización existente.
INSERT INTO "Role" (
  "organizationId", "code", "displayName", "description",
  "createdAt", "createdBy", "updatedAt", "updatedBy"
)
SELECT
  o."id",
  r."code",
  r."displayName",
  r."description",
  NOW(),
  'migration',
  NOW(),
  'migration'
FROM "Organization" o
CROSS JOIN (VALUES
  ('admin',           'Administrador',       'Acceso total: gestión de usuarios, residentes, medicación y configuración.'),
  ('health-director', 'Director de Salud',   'Gestión clínica: residentes, medicación, horarios del equipo.'),
  ('nurse',           'Enfermería',          'Registro de observaciones y ejecución de medicación durante el turno.'),
  ('assistant',       'Asistente',           'Registro de observaciones operativas durante el turno.'),
  ('external',        'Externo',             'Acceso limitado sólo-lectura.')
) AS r("code", "displayName", "description");

-- 3. Agregar roleId nullable a OrganizationMembership.
ALTER TABLE "OrganizationMembership" ADD COLUMN "roleId" UUID;

-- 4. Backfill: mapear roleCode legacy al código canónico y resolver el UUID.
UPDATE "OrganizationMembership" m
SET "roleId" = r."id"
FROM "Role" r
WHERE r."organizationId" = m."organizationId"
  AND r."code" = CASE
    WHEN m."roleCode" = 'coordinator' THEN 'health-director'
    WHEN m."roleCode" = 'staff'       THEN 'assistant'
    ELSE m."roleCode"
  END;

-- 5. Cualquier membresía con roleCode desconocido cae a 'assistant' (misma
--    semántica que la normalización histórica en la capa de aplicación).
UPDATE "OrganizationMembership" m
SET "roleId" = r."id"
FROM "Role" r
WHERE m."roleId" IS NULL
  AND r."organizationId" = m."organizationId"
  AND r."code" = 'assistant';

-- 6. Enforce NOT NULL + FK + índice.
ALTER TABLE "OrganizationMembership" ALTER COLUMN "roleId" SET NOT NULL;

ALTER TABLE "OrganizationMembership"
  ADD CONSTRAINT "OrganizationMembership_roleId_fkey"
  FOREIGN KEY ("roleId") REFERENCES "Role"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "OrganizationMembership_roleId_idx"
  ON "OrganizationMembership"("roleId");

-- 7. Borrar columnas legacy.
ALTER TABLE "OrganizationMembership" DROP COLUMN "roleCode";
ALTER TABLE "User" DROP COLUMN "role";
