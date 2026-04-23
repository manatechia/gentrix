-- Fase 1 de liquidación de horas para externos. Agrega tres tablas:
--   1. `MembershipHourlyRate` — historial de tarifa por membresía.
--   2. `WorkedHourEntry` — carga diaria de horas trabajadas.
--   3. `HourSettlement` — liquidación de un rango cerrado.
--
-- La migración es puramente aditiva; no toca tablas existentes.

-- 1. Historial de tarifa.
CREATE TABLE "MembershipHourlyRate" (
  "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
  "membershipId"  UUID NOT NULL,
  "rate"          DECIMAL(12, 2) NOT NULL,
  "currency"      TEXT NOT NULL,
  "effectiveFrom" DATE NOT NULL,
  "effectiveTo"   DATE,
  "createdAt"     TIMESTAMP(3) NOT NULL,
  "createdBy"     TEXT NOT NULL,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  "updatedBy"     TEXT NOT NULL,
  "deletedAt"     TIMESTAMP(3),
  "deletedBy"     TEXT,
  CONSTRAINT "MembershipHourlyRate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MembershipHourlyRate_membershipId_effectiveFrom_idx"
  ON "MembershipHourlyRate"("membershipId", "effectiveFrom");
CREATE INDEX "MembershipHourlyRate_membershipId_effectiveTo_idx"
  ON "MembershipHourlyRate"("membershipId", "effectiveTo");
CREATE INDEX "MembershipHourlyRate_deletedAt_idx"
  ON "MembershipHourlyRate"("deletedAt");

ALTER TABLE "MembershipHourlyRate"
  ADD CONSTRAINT "MembershipHourlyRate_membershipId_fkey"
  FOREIGN KEY ("membershipId") REFERENCES "OrganizationMembership"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- `rate > 0` y vigencia coherente son invariantes de negocio mínimos.
ALTER TABLE "MembershipHourlyRate"
  ADD CONSTRAINT "MembershipHourlyRate_rate_check" CHECK ("rate" > 0);
ALTER TABLE "MembershipHourlyRate"
  ADD CONSTRAINT "MembershipHourlyRate_effectiveRange_check"
  CHECK ("effectiveTo" IS NULL OR "effectiveTo" > "effectiveFrom");

-- 2. Liquidación (declarada antes de las entries por FK cruzada).
CREATE TABLE "HourSettlement" (
  "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
  "membershipId"  UUID NOT NULL,
  "periodStart"   DATE NOT NULL,
  "periodEnd"     DATE NOT NULL,
  "issuedAt"      TIMESTAMP(3) NOT NULL,
  "paidAt"        TIMESTAMP(3),
  "cancelledAt"   TIMESTAMP(3),
  "notes"         TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL,
  "createdBy"     TEXT NOT NULL,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  "updatedBy"     TEXT NOT NULL,
  "deletedAt"     TIMESTAMP(3),
  "deletedBy"     TEXT,
  CONSTRAINT "HourSettlement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HourSettlement_membershipId_periodStart_periodEnd_idx"
  ON "HourSettlement"("membershipId", "periodStart", "periodEnd");
CREATE INDEX "HourSettlement_membershipId_cancelledAt_idx"
  ON "HourSettlement"("membershipId", "cancelledAt");
CREATE INDEX "HourSettlement_deletedAt_idx"
  ON "HourSettlement"("deletedAt");

ALTER TABLE "HourSettlement"
  ADD CONSTRAINT "HourSettlement_membershipId_fkey"
  FOREIGN KEY ("membershipId") REFERENCES "OrganizationMembership"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "HourSettlement"
  ADD CONSTRAINT "HourSettlement_periodRange_check"
  CHECK ("periodEnd" >= "periodStart");

-- 3. Entries. `settlementId` nullable: NULL = draft; NOT NULL = liquidada
--    (y `appliedRate` / `appliedCurrency` deben estar seteados también;
--    lo chequea el servicio, no el SQL, para no complicar edge cases de
--    migración).
CREATE TABLE "WorkedHourEntry" (
  "id"              UUID NOT NULL DEFAULT gen_random_uuid(),
  "membershipId"    UUID NOT NULL,
  "workDate"        DATE NOT NULL,
  "hours"           DECIMAL(5, 2) NOT NULL,
  "notes"           TEXT,
  "settlementId"    UUID,
  "appliedRate"     DECIMAL(12, 2),
  "appliedCurrency" TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL,
  "createdBy"       TEXT NOT NULL,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  "updatedBy"       TEXT NOT NULL,
  "deletedAt"       TIMESTAMP(3),
  "deletedBy"       TEXT,
  CONSTRAINT "WorkedHourEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorkedHourEntry_membershipId_workDate_idx"
  ON "WorkedHourEntry"("membershipId", "workDate");
CREATE INDEX "WorkedHourEntry_settlementId_idx"
  ON "WorkedHourEntry"("settlementId");
CREATE INDEX "WorkedHourEntry_deletedAt_idx"
  ON "WorkedHourEntry"("deletedAt");

ALTER TABLE "WorkedHourEntry"
  ADD CONSTRAINT "WorkedHourEntry_membershipId_fkey"
  FOREIGN KEY ("membershipId") REFERENCES "OrganizationMembership"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WorkedHourEntry"
  ADD CONSTRAINT "WorkedHourEntry_settlementId_fkey"
  FOREIGN KEY ("settlementId") REFERENCES "HourSettlement"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WorkedHourEntry"
  ADD CONSTRAINT "WorkedHourEntry_hours_check"
  CHECK ("hours" > 0 AND "hours" <= 24);
ALTER TABLE "WorkedHourEntry"
  ADD CONSTRAINT "WorkedHourEntry_appliedRate_check"
  CHECK ("appliedRate" IS NULL OR "appliedRate" > 0);
