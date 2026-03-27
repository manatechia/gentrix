CREATE TABLE "MedicationExecution" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL,
  "facilityId" UUID NOT NULL,
  "medicationOrderId" UUID NOT NULL,
  "residentId" UUID NOT NULL,
  "medicationName" TEXT NOT NULL,
  "result" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT NOT NULL,
  "deletedAt" TIMESTAMP(3),
  "deletedBy" TEXT,
  CONSTRAINT "MedicationExecution_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MedicationExecution_organizationId_residentId_occurredAt_idx"
ON "MedicationExecution"("organizationId", "residentId", "occurredAt");

CREATE INDEX "MedicationExecution_organizationId_medicationOrderId_occurredAt_idx"
ON "MedicationExecution"("organizationId", "medicationOrderId", "occurredAt");

CREATE INDEX "MedicationExecution_deletedAt_idx"
ON "MedicationExecution"("deletedAt");

ALTER TABLE "MedicationExecution"
ADD CONSTRAINT "MedicationExecution_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MedicationExecution"
ADD CONSTRAINT "MedicationExecution_facilityId_fkey"
FOREIGN KEY ("facilityId") REFERENCES "Facility"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MedicationExecution"
ADD CONSTRAINT "MedicationExecution_medicationOrderId_fkey"
FOREIGN KEY ("medicationOrderId") REFERENCES "MedicationOrder"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MedicationExecution"
ADD CONSTRAINT "MedicationExecution_residentId_fkey"
FOREIGN KEY ("residentId") REFERENCES "Resident"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
