# Deuda técnica: auditoría dedicada de cambios de `careStatus`

**Estado:** abierta
**Origen:** primera versión de "Estado de residente" (`careStatus = normal | en_observacion`).
**Decisión actual:** la transición se rastrea reescribiendo `updatedAt` y
`updatedBy` del residente, sumado a los nuevos campos
`careStatusChangedAt` / `careStatusChangedBy`. Se conserva solo el último
cambio: la línea de tiempo histórica se pierde.

## Por qué quedó así

En la primera iteración priorizamos llegar al MVP del estado de residente sin
introducir tablas nuevas. Es suficiente para el flujo actual (pocos estados,
pocas transiciones, sin reportes de auditoría todavía).

## Riesgos / qué nos vamos a perder

- No podemos contestar "¿quién y cuándo movió a este residente entre estados
  durante el último mes?" — solo sabemos el último cambio.
- Si la transición ocurre como efecto de un evento clínico (checkbox "poner
  en observación"), podemos cruzar `ClinicalHistoryEvent` por timestamp pero
  el vínculo es implícito.
- Los reportes de calidad de cuidado (tiempo promedio en observación, tasa
  de re-ingreso a observación) no son posibles sin la historia.

## Propuesta para resolverlo

Modelar `ResidentCareStatusAudit` siguiendo el patrón ya usado por
`PasswordResetAudit` (append-only, sin soft-delete):

```prisma
model ResidentCareStatusAudit {
  id             String   @id @default(uuid()) @db.Uuid
  organizationId String   @db.Uuid
  residentId     String   @db.Uuid
  fromStatus     String
  toStatus       String
  reason         String   // 'event' | 'manual' | 'system'
  triggerEventId String?  @db.Uuid   // FK lógica a ClinicalHistoryEvent
  notes          String?
  occurredAt     DateTime
  actorId        String
  resident       Resident @relation(fields: [residentId], references: [id], onDelete: Cascade)

  @@index([residentId, occurredAt])
  @@index([organizationId, occurredAt])
}
```

Cambios necesarios cuando se aborde:

1. Migración `add_resident_care_status_audit` con la tabla anterior.
2. Extender `ResidentRepository.setCareStatus` para insertar el row en la
   misma transacción Prisma.
3. Pasar `triggerEventId` y `reason` desde `ClinicalHistoryService.create`
   y desde el endpoint manual `PATCH /residents/:id/care-status`.
4. Endpoint `GET /residents/:id/care-status/history` para consumir desde la
   ficha del residente.
5. Tests: append-only (no UPDATE/DELETE), correcta correlación con eventos.

## Cuándo abordarlo

Cuando aparezca alguno de estos disparadores:

- Pedido del cliente para ver historial de estados.
- Necesidad de reportes operativos de tiempo en observación.
- Sumamos un tercer estado clínico (ej. `en_aislamiento`) — el momento ideal
  para no acumular más deuda.

## Referencias

- Implementación inicial: commit en branch `codex/mvp-res-17-resident-modality`.
- Patrón de auditoría a seguir: `apps/backend/prisma/schema.prisma` →
  `PasswordResetAudit`.
