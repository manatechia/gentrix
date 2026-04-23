# Backlog de normalización de la BD

Revisión hecha el 2026-04-23 tras el PR [#29](https://github.com/manatechia/gentrix/pull/29) que
movió los roles de login a su propia tabla (`Role`). Quedaron más campos
con la misma forma de problema: strings repetidos que deberían ser tablas
o enums, y JSON que debería ser relación 1:N.

Las cardinalidades reportadas vienen de la DB de staging (`cddjqisbmdekcktckrfx`);
prod estaba vacía al momento de la revisión.

## 🔴 Alto — denormalización clara o duplicación

### 1. `Resident.familyContacts` (jsonb array) → tabla `ResidentFamilyContact`

Estructura regular repetida por contacto: `{id, fullName, relationship, phone, email, address, notes}`.
Hoy como JSON:

- No se puede buscar por teléfono/email.
- No se puede linkar un evento/observación a un contacto específico ("a quién se avisó de la caída").
- El `id` del seed es un string inventado (`resident-family-contact-...`), no una clave real.
- No hay integridad de tipos: cualquiera podría escribir `phone: 1234` (number) o dejar campos faltantes.

Migración propuesta:

```prisma
model ResidentFamilyContact {
  id           String   @id @default(uuid()) @db.Uuid
  residentId   String   @db.Uuid
  fullName     String
  relationship String
  phone        String?
  email        String?
  address      String?
  notes        String?
  // audit estándar
  resident     Resident @relation(fields: [residentId], references: [id], onDelete: Cascade)

  @@index([residentId])
}
```

Backfill: expandir `familyContacts` jsonb array → filas. Después `DROP COLUMN`.

### 2. `Resident.attachments` (jsonb array) → tabla `ResidentAttachment`

Mismo patrón. Hoy está vacío (`[]`), pero cuando empiecen a guardar archivos reales
(URL, mimeType, tamaño, uploader) necesita ser tabla propia con auditoría.

### 3. Direcciones duplicadas 3 veces como JSON sin shape común

- `Resident.address` (jsonb) — incluye campo `room` que **duplica** `Resident.room` top-level → pueden divergir (bug latente).
- `Facility.address` (jsonb) — otro shape.
- `familyContacts[].address` — string libre.

Opciones:

- **Conservador:** tabla `Address` con FK desde Resident, Facility, etc. Permite reutilizar y geocode futuro.
- **Mínimo:** un único shape tipado `{street, city, state, postalCode, country?}` consistente en todas, documentado en `@gentrix/shared-types`, y **dropear `Resident.address.room`** para eliminar la duplicación con `Resident.room`.

### 4. `StaffMember.ward` + `StaffFacilityAssignment.ward` → tabla `Ward`

Strings `"Unidad A" | "Unidad B" | "Consultorio"` repetidos en dos tablas sin FK.
Idéntico al problema de roles antes del PR #29: la misma unidad física vive como
texto en varios lugares, sin garantía de consistencia.

```prisma
model Ward {
  id         String @id @default(uuid()) @db.Uuid
  facilityId String @db.Uuid
  code       String          // "A", "B", "consultorio"
  name       String          // "Unidad A"
  // audit
  facility   Facility @relation(fields: [facilityId], references: [id], onDelete: Restrict)
  @@unique([facilityId, code])
}
```

Es probablemente la reforma con más **upside operativo** post-roles: habilita
ocupación por unidad, permisos por ala (`MembershipFacilityScope` con `wardId` opcional),
reportes de staffing por ward.

### 5. `StaffMember.role` + `StaffFacilityAssignment.assignmentRole` → tabla `JobTitle`

Strings `nurse | doctor | caregiver` repetidos en dos tablas. Es **puesto laboral**,
no permisos de login (esos ya viven en `Role`). Mismo vicio que los roles pre-PR #29.

Dos caminos:

- **Tabla propia `JobTitle`** por organización.
- **Reusar `Role`** con un discriminante `kind: 'permission' | 'job'` — menos tablas pero mezcla conceptos.

Sugerencia: tabla propia, son dominios distintos.

---

## 🟡 Medio — strings con vocabulario cerrado (Postgres `enum` o lookup)

Valores acotados, estables, no editables por usuarios finales. Dos opciones
por columna:

- **Postgres `CREATE TYPE ... AS ENUM`** (Prisma `enum` block) — type safety a nivel DB, cero overhead, poco editable sin migración.
- **Tabla lookup por org** — editable en runtime, overhead mínimo de JOIN. Sólo vale si se espera customización.

Recomendación default para esta lista: **enum postgres**.

| Columna | Valores vistos en staging | Código prevé |
|---|---|---|
| `Resident.careLevel` | `assisted, high-dependency, memory-care` | mismos |
| `Resident.careStatus` | `normal` | `+observation, +critical` |
| `Resident.sex` | `femenino, masculino` | mismos |
| `Resident.status` | `active` | `+inactive, +archived` |
| `MedicationOrder.route` | `oral, subcutaneous` | mismos |
| `MedicationOrder.frequency` | `daily, nightly, twice-daily` | mismos |
| `MedicationOrder.status` | `active` | mismos |
| `MedicationExecution.result` | `administered, omitted, rejected` | mismos |
| `ClinicalHistoryEvent.eventType` | `admission-note, follow-up` | mismos |
| `ResidentAgendaSeries.recurrenceType` | — | `daily/weekly/...` |
| `ResidentAgendaSeriesException.action` | — | `skip/override` |
| `MembershipFacilityScope.scopeType` | `assigned` | `+managed, +read-only` |
| `PasswordResetAudit.action` / `result` | — | eventos cerrados |
| `Organization.status`, `Facility.status`, `MedicationCatalogItem.status` | `active` | mismos |
| `StaffMember.shift` | `morning, afternoon` | `+night` |

Se pueden agrupar en un único PR "enum postgres por toda la schema" —
poco riesgo, mucho type safety, backfill trivial (las columnas ya sólo
contienen valores canónicos).

---

## 🟠 Campos libres que deberían ser catálogo

### `Resident.maritalStatus`

Ya se ve contaminado en staging: `Casada | Viuda | Viudo` conviven con
concordancia gramatical. No se puede agrupar "total de casados" sin normalizar.

Propuesta: enum `single | married | widowed | divorced | domestic-partner`,
render localizado en la UI.

### `Resident.nationality` + `Resident.documentIssuingCountry`

Texto libre (`"Argentina"` en todos los seeds). Tabla `Country` con ISO 3166
es estándar cuando se soporten usuarios no-Argentinos. Mientras tanto, enum
corto con los países esperados.

### `Resident.documentType`

`"dni"` hoy. Argentina tiene LC, LE, CI, pasaporte. Enum cerrado alcanza.

---

## 🟢 Bajo — no urgente, criterio del equipo

### JSONs unidimensionales 1:1 con `Resident`

`clinicalProfile`, `geriatricAssessment`, `belongings`, `insurance`, `psychiatry`,
`transfer`, `discharge`: son "fichas" con shape propio, 1:1 con el residente.
La denormalización aquí es deliberada y barata **mientras no se necesite**:

- **Historial temporal** (ej. evolución del `geriatricAssessment`) → tabla `ResidentAssessment` con `validFrom`/`validTo` y el residente referenciándose a la última.
- **Búsqueda indexada por campos internos** (hoy no pasa).
- **Enums para campos internos** (ej. `geriatricAssessment.cognition: monitored | preserved | high-support`) → esos sí valen como enum postgres aunque el contenedor siga siendo JSON.

### `MedicationOrder.scheduleTimes` (jsonb array de `"HH:mm"`)

Arrays chicos, OK como están. Cambiaría sólo si se quiere linkar cada
`MedicationExecution` a una hora específica de la orden (hoy no se hace).

### `ResidentAgendaSeries.recurrenceDaysOfWeek` (int[])

Array postgres nativo para días 0-6. Idiomático, no tocar.

---

## Orden sugerido si se avanza

1. **`Ward` como tabla** — upside operativo grande (ocupación, permisos por ala). 1-2 días.
2. **`ResidentFamilyContact` como tabla** — habilita búsqueda, linkeo a eventos, auditoría de cambios. ~medio día.
3. **Enums postgres para la tabla 🟡** — un único PR multi-columna. Medio día, bajo riesgo.
4. **`JobTitle`** consolidando `StaffMember.role` + `StaffFacilityAssignment.assignmentRole`. Similar a roles, no urgente.
5. **`Address`** como tabla o shape tipado único. Cuando se toque el flujo de edición.
6. **`Country` lookup**. Cuando se soporten usuarios no-AR.

Los de mayor ratio beneficio/riesgo: **`Ward`** y el **pack de enums**.

## Principios a aplicar en cada migración

Recordatorios del PR #29 que se mantienen válidos:

- Backfill explícito en la migración SQL antes de `SET NOT NULL` + FK.
- Mapear valores legacy a canónicos dentro del mismo `UPDATE` (ej. `coordinator → health-director`).
- Dropear columnas viejas en la misma migración — no dejar "compat" sin plan de cierre.
- Sembrar los catálogos por organización en la misma migración (`Role`, `Ward`, etc.).
- Actualizar `seed.mjs` y `seed-if-empty.mjs` para el nuevo shape.
- Tests de repos y `prisma validate` + `nx run backend:build` + `vitest run apps/backend` antes del commit.
