-- Eventos auditables de transición del estado clínico operativo del residente
-- (`careStatus`). Capturan el cierre formal de observación con motivo y nota,
-- y dejan rastro permanente en el timeline del residente. Cada cambio
-- significativo (normal -> en_observacion, en_observacion -> normal) escribe
-- una fila en esta tabla dentro de la misma transacción que el UPDATE del
-- residente. Sin soft-delete: estos eventos son hechos del pasado y no se
-- borran.
CREATE TABLE "ResidentCareStatusChange" (
  "id"             UUID         NOT NULL,
  "organizationId" UUID         NOT NULL,
  "facilityId"     UUID,
  "residentId"     UUID         NOT NULL,
  "fromStatus"     TEXT         NOT NULL,
  "toStatus"       TEXT         NOT NULL,
  "closureReason"  TEXT,
  "note"           TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL,
  "createdBy"      TEXT         NOT NULL,

  CONSTRAINT "ResidentCareStatusChange_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ResidentCareStatusChange"
  ADD CONSTRAINT "ResidentCareStatusChange_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ResidentCareStatusChange"
  ADD CONSTRAINT "ResidentCareStatusChange_facilityId_fkey"
  FOREIGN KEY ("facilityId") REFERENCES "Facility"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ResidentCareStatusChange"
  ADD CONSTRAINT "ResidentCareStatusChange_residentId_fkey"
  FOREIGN KEY ("residentId") REFERENCES "Resident"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- El cierre formal (en_observacion -> normal) requiere motivo a nivel
-- aplicación; la integridad básica del enum se chequea acá para que un
-- INSERT directo no pueda meter basura.
ALTER TABLE "ResidentCareStatusChange"
  ADD CONSTRAINT "ResidentCareStatusChange_closureReason_check"
  CHECK (
    "closureReason" IS NULL
    OR "closureReason" IN ('estable', 'escalado_medico', 'derivado', 'otro')
  );

CREATE INDEX "ResidentCareStatusChange_residentId_createdAt_idx"
  ON "ResidentCareStatusChange" ("residentId", "createdAt");

CREATE INDEX "ResidentCareStatusChange_organizationId_createdAt_idx"
  ON "ResidentCareStatusChange" ("organizationId", "createdAt");
