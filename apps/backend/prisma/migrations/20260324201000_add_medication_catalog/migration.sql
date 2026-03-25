CREATE TABLE "MedicationCatalogItem" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "medicationName" TEXT NOT NULL,
  "activeIngredient" TEXT,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT NOT NULL,
  "deletedAt" TIMESTAMP(3),
  "deletedBy" TEXT,
  CONSTRAINT "MedicationCatalogItem_pkey" PRIMARY KEY ("id")
);

INSERT INTO "MedicationCatalogItem" (
  "medicationName",
  "activeIngredient",
  "status",
  "createdAt",
  "createdBy",
  "updatedAt",
  "updatedBy"
)
SELECT
  existing."medicationName",
  existing."medicationName",
  'active',
  NOW(),
  'migration',
  NOW(),
  'migration'
FROM (
  SELECT DISTINCT "medicationName"
  FROM "MedicationOrder"
) AS existing;

ALTER TABLE "MedicationOrder"
ADD COLUMN "medicationCatalogId" UUID;

UPDATE "MedicationOrder" AS "order"
SET "medicationCatalogId" = "catalog"."id"
FROM "MedicationCatalogItem" AS "catalog"
WHERE "catalog"."medicationName" = "order"."medicationName";

ALTER TABLE "MedicationOrder"
ALTER COLUMN "medicationCatalogId" SET NOT NULL;

CREATE UNIQUE INDEX "MedicationCatalogItem_medicationName_key"
ON "MedicationCatalogItem"("medicationName");

CREATE INDEX "MedicationCatalogItem_deletedAt_idx"
ON "MedicationCatalogItem"("deletedAt");

CREATE INDEX "MedicationOrder_medicationCatalogId_idx"
ON "MedicationOrder"("medicationCatalogId");

ALTER TABLE "MedicationOrder"
ADD CONSTRAINT "MedicationOrder_medicationCatalogId_fkey"
FOREIGN KEY ("medicationCatalogId") REFERENCES "MedicationCatalogItem"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
