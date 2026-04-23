-- Etapa 5 del backlog de normalización: eliminar la duplicación entre
-- `Resident.address.room` (jsonb) y `Resident.room` (columna top-level).
-- La fuente de verdad es `Resident.room`; la key `room` dentro del
-- jsonb desaparece.

UPDATE "Resident"
SET "address" = "address" - 'room'
WHERE "address" ? 'room';
