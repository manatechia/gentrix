-- Etapa 1 del backlog de normalización (docs/tech-debt/db-normalization-backlog.md):
-- aplicar CHECK constraints sobre las columnas string con vocabulario cerrado.
-- No se crean Postgres ENUM types para evitar el churn de renombrar ~64 literales
-- en 29 archivos TS con guiones (ej. 'high-dependency'); el dominio de valores
-- queda igualmente forzado a nivel DB.

-- 1. Normalizar Resident.maritalStatus al vocabulario canónico antes del CHECK.
--    Los seeds histÃ³ricos usaban 'Casada / Viuda / Viudo' (espaÃ±ol con gÃ©nero).
UPDATE "Resident"
SET "maritalStatus" = CASE LOWER(TRIM("maritalStatus"))
  WHEN ''             THEN NULL
  WHEN 'casado'       THEN 'married'
  WHEN 'casada'       THEN 'married'
  WHEN 'casados'      THEN 'married'
  WHEN 'viudo'        THEN 'widowed'
  WHEN 'viuda'        THEN 'widowed'
  WHEN 'viudos'       THEN 'widowed'
  WHEN 'soltero'      THEN 'single'
  WHEN 'soltera'      THEN 'single'
  WHEN 'solteros'     THEN 'single'
  WHEN 'divorciado'   THEN 'divorced'
  WHEN 'divorciada'   THEN 'divorced'
  WHEN 'divorciados'  THEN 'divorced'
  WHEN 'separado'     THEN 'divorced'
  WHEN 'separada'     THEN 'divorced'
  WHEN 'unido'        THEN 'domestic-partner'
  WHEN 'unida'        THEN 'domestic-partner'
  WHEN 'en pareja'    THEN 'domestic-partner'
  WHEN 'concubinato'  THEN 'domestic-partner'
  WHEN 'concubino'    THEN 'domestic-partner'
  WHEN 'concubina'    THEN 'domestic-partner'
  ELSE "maritalStatus"  -- si ya es canÃ³nico (o desconocido) lo deja
END
WHERE "maritalStatus" IS NOT NULL;

-- 2. CHECK constraints por tabla.columna. NULL se acepta automÃ¡ticamente (UNKNOWN
--    no es FALSE), asÃ­ que no hace falta "col IS NULL OR ...".

-- Organization
ALTER TABLE "Organization"
  ADD CONSTRAINT "Organization_status_check"
  CHECK ("status" IN ('active','inactive','archived'));

-- Facility
ALTER TABLE "Facility"
  ADD CONSTRAINT "Facility_status_check"
  CHECK ("status" IN ('active','inactive','archived'));

-- User
ALTER TABLE "User"
  ADD CONSTRAINT "User_status_check"
  CHECK ("status" IN ('active','inactive','archived'));

-- OrganizationMembership (status: ciclo de vida del membership)
ALTER TABLE "OrganizationMembership"
  ADD CONSTRAINT "OrganizationMembership_status_check"
  CHECK ("status" IN ('active','inactive'));

-- MembershipFacilityScope
ALTER TABLE "MembershipFacilityScope"
  ADD CONSTRAINT "MembershipFacilityScope_scopeType_check"
  CHECK ("scopeType" IN ('assigned','managed','read-only'));

-- Resident
ALTER TABLE "Resident"
  ADD CONSTRAINT "Resident_status_check"
  CHECK ("status" IN ('active','inactive','archived'));

ALTER TABLE "Resident"
  ADD CONSTRAINT "Resident_sex_check"
  CHECK ("sex" IN ('femenino','masculino','x'));

ALTER TABLE "Resident"
  ADD CONSTRAINT "Resident_careLevel_check"
  CHECK ("careLevel" IN ('independent','assisted','high-dependency','memory-care'));

ALTER TABLE "Resident"
  ADD CONSTRAINT "Resident_careStatus_check"
  CHECK ("careStatus" IN ('normal','en_observacion'));

ALTER TABLE "Resident"
  ADD CONSTRAINT "Resident_documentType_check"
  CHECK ("documentType" IN ('dni','pasaporte','cedula','libreta-civica','otro'));

ALTER TABLE "Resident"
  ADD CONSTRAINT "Resident_maritalStatus_check"
  CHECK ("maritalStatus" IN ('single','married','widowed','divorced','domestic-partner'));

-- StaffMember
ALTER TABLE "StaffMember"
  ADD CONSTRAINT "StaffMember_status_check"
  CHECK ("status" IN ('active','inactive','archived'));

ALTER TABLE "StaffMember"
  ADD CONSTRAINT "StaffMember_shift_check"
  CHECK ("shift" IN ('morning','afternoon','night'));

-- StaffFacilityAssignment
ALTER TABLE "StaffFacilityAssignment"
  ADD CONSTRAINT "StaffFacilityAssignment_status_check"
  CHECK ("status" IN ('active','inactive','archived'));

-- MedicationCatalogItem
ALTER TABLE "MedicationCatalogItem"
  ADD CONSTRAINT "MedicationCatalogItem_status_check"
  CHECK ("status" IN ('active','inactive','archived'));

-- MedicationOrder
ALTER TABLE "MedicationOrder"
  ADD CONSTRAINT "MedicationOrder_status_check"
  CHECK ("status" IN ('active','inactive','archived'));

ALTER TABLE "MedicationOrder"
  ADD CONSTRAINT "MedicationOrder_route_check"
  CHECK ("route" IN ('oral','intravenous','subcutaneous','topical'));

ALTER TABLE "MedicationOrder"
  ADD CONSTRAINT "MedicationOrder_frequency_check"
  CHECK ("frequency" IN ('daily','twice-daily','nightly','as-needed'));

-- MedicationExecution
ALTER TABLE "MedicationExecution"
  ADD CONSTRAINT "MedicationExecution_result_check"
  CHECK ("result" IN ('administered','omitted','rejected'));

-- ClinicalHistoryEvent
ALTER TABLE "ClinicalHistoryEvent"
  ADD CONSTRAINT "ClinicalHistoryEvent_eventType_check"
  CHECK ("eventType" IN ('admission-note','follow-up','medical-history'));

-- ResidentAgendaSeries
ALTER TABLE "ResidentAgendaSeries"
  ADD CONSTRAINT "ResidentAgendaSeries_recurrenceType_check"
  CHECK ("recurrenceType" IN ('daily','weekly','monthly','yearly'));

-- ResidentAgendaSeriesException
ALTER TABLE "ResidentAgendaSeriesException"
  ADD CONSTRAINT "ResidentAgendaSeriesException_action_check"
  CHECK ("action" IN ('skip','override'));

-- PasswordResetAudit
ALTER TABLE "PasswordResetAudit"
  ADD CONSTRAINT "PasswordResetAudit_action_check"
  CHECK ("action" IN ('admin-reset','forced-change-completed','forced-change-failed'));

ALTER TABLE "PasswordResetAudit"
  ADD CONSTRAINT "PasswordResetAudit_result_check"
  CHECK ("result" IN ('success','failure'));
