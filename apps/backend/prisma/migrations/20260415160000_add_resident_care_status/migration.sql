-- Estado clínico operativo del residente (independiente del status administrativo).
-- En esta primera versión soporta los valores 'normal' y 'en_observacion'.
ALTER TABLE "Resident"
  ADD COLUMN "careStatus"          TEXT         NOT NULL DEFAULT 'normal',
  ADD COLUMN "careStatusChangedAt" TIMESTAMP(3),
  ADD COLUMN "careStatusChangedBy" TEXT;

-- Backfill defensivo: todos los residentes ya existentes quedan en estado normal.
UPDATE "Resident" SET "careStatus" = 'normal' WHERE "careStatus" IS NULL;

-- Índice para alimentar la lista de residentes en observación del dashboard.
CREATE INDEX "Resident_organizationId_careStatus_deletedAt_idx"
  ON "Resident" ("organizationId", "careStatus", "deletedAt");
