CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "User" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "fullName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT NOT NULL,
  "deletedAt" TIMESTAMP(3),
  "deletedBy" TEXT,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
  "token" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT NOT NULL,
  "deletedAt" TIMESTAMP(3),
  "deletedBy" TEXT,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("token")
);

CREATE TABLE "Resident" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "birthDate" TIMESTAMP(3) NOT NULL,
  "admissionDate" TIMESTAMP(3) NOT NULL,
  "room" TEXT NOT NULL,
  "careLevel" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "address" JSONB NOT NULL,
  "emergencyContact" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT NOT NULL,
  "deletedAt" TIMESTAMP(3),
  "deletedBy" TEXT,
  CONSTRAINT "Resident_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StaffMember" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "ward" TEXT NOT NULL,
  "shift" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT NOT NULL,
  "deletedAt" TIMESTAMP(3),
  "deletedBy" TEXT,
  CONSTRAINT "StaffMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MedicationOrder" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "residentId" UUID NOT NULL,
  "medicationName" TEXT NOT NULL,
  "dose" TEXT NOT NULL,
  "route" TEXT NOT NULL,
  "frequency" TEXT NOT NULL,
  "scheduleTimes" JSONB NOT NULL,
  "prescribedBy" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3),
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT NOT NULL,
  "deletedAt" TIMESTAMP(3),
  "deletedBy" TEXT,
  CONSTRAINT "MedicationOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClinicalHistoryEvent" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "residentId" UUID NOT NULL,
  "eventType" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT NOT NULL,
  "deletedAt" TIMESTAMP(3),
  "deletedBy" TEXT,
  CONSTRAINT "ClinicalHistoryEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StaffSchedule" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "staffId" UUID NOT NULL,
  "weekday" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "exceptionDate" TIMESTAMP(3),
  "coverageNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT NOT NULL,
  "deletedAt" TIMESTAMP(3),
  "deletedBy" TEXT,
  CONSTRAINT "StaffSchedule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_deletedAt_idx" ON "Session"("deletedAt");
CREATE INDEX "Resident_deletedAt_idx" ON "Resident"("deletedAt");
CREATE INDEX "StaffMember_deletedAt_idx" ON "StaffMember"("deletedAt");
CREATE INDEX "MedicationOrder_residentId_idx" ON "MedicationOrder"("residentId");
CREATE INDEX "MedicationOrder_deletedAt_idx" ON "MedicationOrder"("deletedAt");
CREATE INDEX "ClinicalHistoryEvent_residentId_occurredAt_idx" ON "ClinicalHistoryEvent"("residentId", "occurredAt");
CREATE INDEX "ClinicalHistoryEvent_deletedAt_idx" ON "ClinicalHistoryEvent"("deletedAt");
CREATE INDEX "StaffSchedule_staffId_idx" ON "StaffSchedule"("staffId");
CREATE INDEX "StaffSchedule_exceptionDate_idx" ON "StaffSchedule"("exceptionDate");
CREATE INDEX "StaffSchedule_deletedAt_idx" ON "StaffSchedule"("deletedAt");

ALTER TABLE "Session"
ADD CONSTRAINT "Session_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MedicationOrder"
ADD CONSTRAINT "MedicationOrder_residentId_fkey"
FOREIGN KEY ("residentId") REFERENCES "Resident"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ClinicalHistoryEvent"
ADD CONSTRAINT "ClinicalHistoryEvent_residentId_fkey"
FOREIGN KEY ("residentId") REFERENCES "Resident"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StaffSchedule"
ADD CONSTRAINT "StaffSchedule_staffId_fkey"
FOREIGN KEY ("staffId") REFERENCES "StaffMember"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
