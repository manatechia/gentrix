-- Observación operativa simple del residente. Nota de texto libre con
-- timestamp automático. Separada de ClinicalHistoryEvent porque no tiene
-- tipo ni título — es un apunte del día.
CREATE TABLE "ResidentObservationNote" (
  "id"             UUID         NOT NULL,
  "organizationId" UUID         NOT NULL,
  "facilityId"     UUID,
  "residentId"     UUID         NOT NULL,
  "note"           TEXT         NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL,
  "createdBy"      TEXT         NOT NULL,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  "updatedBy"      TEXT         NOT NULL,
  "deletedAt"      TIMESTAMP(3),
  "deletedBy"      TEXT,

  CONSTRAINT "ResidentObservationNote_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ResidentObservationNote"
  ADD CONSTRAINT "ResidentObservationNote_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ResidentObservationNote"
  ADD CONSTRAINT "ResidentObservationNote_facilityId_fkey"
  FOREIGN KEY ("facilityId") REFERENCES "Facility"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ResidentObservationNote"
  ADD CONSTRAINT "ResidentObservationNote_residentId_fkey"
  FOREIGN KEY ("residentId") REFERENCES "Resident"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "ResidentObservationNote_residentId_createdAt_deletedAt_idx"
  ON "ResidentObservationNote" ("residentId", "createdAt", "deletedAt");

CREATE INDEX "ResidentObservationNote_organizationId_deletedAt_idx"
  ON "ResidentObservationNote" ("organizationId", "deletedAt");

CREATE INDEX "ResidentObservationNote_deletedAt_idx"
  ON "ResidentObservationNote" ("deletedAt");
