-- Serie de agenda recurrente del residente (regla). Las ocurrencias concretas
-- se expanden al listar, no se materializan.
CREATE TABLE "ResidentAgendaSeries" (
  "id"                   UUID         NOT NULL,
  "organizationId"       UUID         NOT NULL,
  "facilityId"           UUID,
  "residentId"           UUID         NOT NULL,
  "title"                TEXT         NOT NULL,
  "description"          TEXT,
  "recurrenceType"       TEXT         NOT NULL,
  "recurrenceDaysOfWeek" INTEGER[]    NOT NULL DEFAULT '{}',
  "timeOfDay"            TEXT         NOT NULL,
  "startsOn"             DATE         NOT NULL,
  "endsOn"               DATE,
  "createdAt"            TIMESTAMP(3) NOT NULL,
  "createdBy"            TEXT         NOT NULL,
  "updatedAt"            TIMESTAMP(3) NOT NULL,
  "updatedBy"            TEXT         NOT NULL,
  "deletedAt"            TIMESTAMP(3),
  "deletedBy"            TEXT,

  CONSTRAINT "ResidentAgendaSeries_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ResidentAgendaSeries"
  ADD CONSTRAINT "ResidentAgendaSeries_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ResidentAgendaSeries"
  ADD CONSTRAINT "ResidentAgendaSeries_facilityId_fkey"
  FOREIGN KEY ("facilityId") REFERENCES "Facility"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ResidentAgendaSeries"
  ADD CONSTRAINT "ResidentAgendaSeries_residentId_fkey"
  FOREIGN KEY ("residentId") REFERENCES "Resident"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "ResidentAgendaSeries_organizationId_deletedAt_idx"
  ON "ResidentAgendaSeries" ("organizationId", "deletedAt");

CREATE INDEX "ResidentAgendaSeries_residentId_deletedAt_idx"
  ON "ResidentAgendaSeries" ("residentId", "deletedAt");

CREATE INDEX "ResidentAgendaSeries_deletedAt_idx"
  ON "ResidentAgendaSeries" ("deletedAt");

-- Excepción puntual de una serie para una fecha específica (skip u override).
CREATE TABLE "ResidentAgendaSeriesException" (
  "id"                   UUID         NOT NULL,
  "seriesId"             UUID         NOT NULL,
  "occurrenceDate"       DATE         NOT NULL,
  "action"               TEXT         NOT NULL,
  "overrideTitle"        TEXT,
  "overrideDescription"  TEXT,
  "overrideScheduledAt"  TIMESTAMP(3),
  "createdAt"            TIMESTAMP(3) NOT NULL,
  "createdBy"            TEXT         NOT NULL,
  "updatedAt"            TIMESTAMP(3) NOT NULL,
  "updatedBy"            TEXT         NOT NULL,

  CONSTRAINT "ResidentAgendaSeriesException_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ResidentAgendaSeriesException"
  ADD CONSTRAINT "ResidentAgendaSeriesException_seriesId_fkey"
  FOREIGN KEY ("seriesId") REFERENCES "ResidentAgendaSeries"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "ResidentAgendaSeriesException_seriesId_occurrenceDate_key"
  ON "ResidentAgendaSeriesException" ("seriesId", "occurrenceDate");

CREATE INDEX "ResidentAgendaSeriesException_seriesId_idx"
  ON "ResidentAgendaSeriesException" ("seriesId");
