-- Etapa 3 del backlog de normalización: expandir el jsonb array
-- Resident.familyContacts a una tabla 1:N con identidad real (UUID).

-- 1. Tabla ResidentFamilyContact.
CREATE TABLE "ResidentFamilyContact" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "residentId" UUID NOT NULL,
  "fullName" TEXT NOT NULL,
  "relationship" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "address" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT NOT NULL,
  "deletedAt" TIMESTAMP(3),
  "deletedBy" TEXT,
  CONSTRAINT "ResidentFamilyContact_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ResidentFamilyContact_residentId_idx"
  ON "ResidentFamilyContact"("residentId");
CREATE INDEX "ResidentFamilyContact_deletedAt_idx"
  ON "ResidentFamilyContact"("deletedAt");

ALTER TABLE "ResidentFamilyContact"
  ADD CONSTRAINT "ResidentFamilyContact_residentId_fkey"
  FOREIGN KEY ("residentId") REFERENCES "Resident"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Backfill: expandir el jsonb array a filas.
--    Requiere que cada contacto tenga al menos fullName y relationship;
--    phone cae a string vacío si no está (columna NOT NULL por contrato).
INSERT INTO "ResidentFamilyContact" (
  "residentId", "fullName", "relationship",
  "phone", "email", "address", "notes",
  "createdAt", "createdBy", "updatedAt", "updatedBy"
)
SELECT
  r."id",
  elem->>'fullName',
  elem->>'relationship',
  COALESCE(NULLIF(elem->>'phone', ''), '') AS phone,
  NULLIF(elem->>'email', ''),
  NULLIF(elem->>'address', ''),
  NULLIF(elem->>'notes', ''),
  COALESCE(r."createdAt", NOW()),
  'migration',
  COALESCE(r."updatedAt", NOW()),
  'migration'
FROM "Resident" r
CROSS JOIN LATERAL jsonb_array_elements(
  COALESCE(r."familyContacts", '[]'::jsonb)
) AS elem
WHERE elem->>'fullName' IS NOT NULL
  AND TRIM(elem->>'fullName') <> ''
  AND elem->>'relationship' IS NOT NULL
  AND TRIM(elem->>'relationship') <> '';

-- 3. Drop columna jsonb legacy.
ALTER TABLE "Resident" DROP COLUMN "familyContacts";
