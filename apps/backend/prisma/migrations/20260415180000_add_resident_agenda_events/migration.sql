-- Agenda operativa del residente. Cada fila es una actividad puntual a futuro
-- (dar medicación, clase de yoga, recordatorio de turno). No modela duración
-- ni ejecución: sólo responde "qué sigue para este residente".
CREATE TABLE "ResidentAgendaEvent" (
  "id"             UUID         NOT NULL,
  "organizationId" UUID         NOT NULL,
  "facilityId"     UUID,
  "residentId"     UUID         NOT NULL,
  "title"          TEXT         NOT NULL,
  "description"    TEXT,
  "scheduledAt"    TIMESTAMP(3) NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL,
  "createdBy"      TEXT         NOT NULL,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  "updatedBy"      TEXT         NOT NULL,
  "deletedAt"      TIMESTAMP(3),
  "deletedBy"      TEXT,

  CONSTRAINT "ResidentAgendaEvent_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ResidentAgendaEvent"
  ADD CONSTRAINT "ResidentAgendaEvent_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ResidentAgendaEvent"
  ADD CONSTRAINT "ResidentAgendaEvent_facilityId_fkey"
  FOREIGN KEY ("facilityId") REFERENCES "Facility"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ResidentAgendaEvent"
  ADD CONSTRAINT "ResidentAgendaEvent_residentId_fkey"
  FOREIGN KEY ("residentId") REFERENCES "Resident"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Dashboard: próximas tareas de toda la organización ordenadas por scheduledAt.
CREATE INDEX "ResidentAgendaEvent_organizationId_scheduledAt_deletedAt_idx"
  ON "ResidentAgendaEvent" ("organizationId", "scheduledAt", "deletedAt");

-- Ficha del residente: próximos eventos de ese residente por scheduledAt.
CREATE INDEX "ResidentAgendaEvent_residentId_scheduledAt_deletedAt_idx"
  ON "ResidentAgendaEvent" ("residentId", "scheduledAt", "deletedAt");

CREATE INDEX "ResidentAgendaEvent_deletedAt_idx"
  ON "ResidentAgendaEvent" ("deletedAt");
