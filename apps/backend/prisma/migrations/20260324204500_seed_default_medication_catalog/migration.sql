INSERT INTO "MedicationCatalogItem" (
  "medicationName",
  "activeIngredient",
  "status",
  "createdAt",
  "createdBy",
  "updatedAt",
  "updatedBy"
)
VALUES
  ('Paracetamol', 'Paracetamol', 'active', NOW(), 'migration', NOW(), 'migration'),
  ('Donepezil', 'Donepezil', 'active', NOW(), 'migration', NOW(), 'migration'),
  ('Enoxaparina', 'Enoxaparina', 'active', NOW(), 'migration', NOW(), 'migration'),
  ('Metformina', 'Metformina', 'active', NOW(), 'migration', NOW(), 'migration'),
  ('Levotiroxina', 'Levotiroxina', 'active', NOW(), 'migration', NOW(), 'migration'),
  ('Furosemida', 'Furosemida', 'active', NOW(), 'migration', NOW(), 'migration'),
  ('Quetiapina', 'Quetiapina', 'active', NOW(), 'migration', NOW(), 'migration'),
  ('Risperidona', 'Risperidona', 'active', NOW(), 'migration', NOW(), 'migration')
ON CONFLICT ("medicationName") DO UPDATE
SET
  "activeIngredient" = EXCLUDED."activeIngredient",
  "status" = EXCLUDED."status",
  "updatedAt" = NOW(),
  "updatedBy" = 'migration'
WHERE "MedicationCatalogItem"."deletedAt" IS NULL;
