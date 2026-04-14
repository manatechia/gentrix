CREATE TABLE "ResidentObservation" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL,
  "residentId" UUID NOT NULL,
  "status" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "openedAt" TIMESTAMP(3) NOT NULL,
  "openedBy" TEXT NOT NULL,
  "resolvedAt" TIMESTAMP(3),
  "resolvedBy" TEXT,
  "resolutionType" TEXT,
  "resolutionSummary" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT NOT NULL,
  "deletedAt" TIMESTAMP(3),
  "deletedBy" TEXT,
  CONSTRAINT "ResidentObservation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ResidentObservationEntry" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "observationId" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "residentId" UUID NOT NULL,
  "entryType" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT NOT NULL,
  "deletedAt" TIMESTAMP(3),
  "deletedBy" TEXT,
  CONSTRAINT "ResidentObservationEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ResidentObservation_organizationId_residentId_status_openedAt_idx"
ON "ResidentObservation"("organizationId", "residentId", "status", "openedAt");

CREATE INDEX "ResidentObservation_deletedAt_idx"
ON "ResidentObservation"("deletedAt");

CREATE INDEX "ResidentObservationEntry_observationId_occurredAt_idx"
ON "ResidentObservationEntry"("observationId", "occurredAt");

CREATE INDEX "ResidentObservationEntry_organizationId_residentId_occurredAt_idx"
ON "ResidentObservationEntry"("organizationId", "residentId", "occurredAt");

CREATE INDEX "ResidentObservationEntry_deletedAt_idx"
ON "ResidentObservationEntry"("deletedAt");

ALTER TABLE "ResidentObservation"
ADD CONSTRAINT "ResidentObservation_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ResidentObservation"
ADD CONSTRAINT "ResidentObservation_residentId_fkey"
FOREIGN KEY ("residentId") REFERENCES "Resident"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ResidentObservationEntry"
ADD CONSTRAINT "ResidentObservationEntry_observationId_fkey"
FOREIGN KEY ("observationId") REFERENCES "ResidentObservation"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ResidentObservationEntry"
ADD CONSTRAINT "ResidentObservationEntry_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ResidentObservationEntry"
ADD CONSTRAINT "ResidentObservationEntry_residentId_fkey"
FOREIGN KEY ("residentId") REFERENCES "Resident"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
