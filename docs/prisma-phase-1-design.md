# Diseno Prisma Fase 1

## Proposito

Este documento traduce el modelo de dominio propuesto a un corte concreto de implementacion en Prisma.
La meta de fase 1 no es resolver todo el modelo futuro, sino dejar la base multi-tenant y de autorizacion correctamente armada sin obligarnos despues a una migracion grande.

Fecha de referencia: 2026-03-24.

Documentos relacionados:

- `docs/multitenancy-rbac-domain-north.md`
- `docs/domain-entity-model.md`

## Objetivo De Fase 1

Construir la base de multi-tenant por organizacion con residencias, auth persistida, memberships y scoping operativo sobre las entidades ya existentes.

## No Objetivos De Fase 1

- no implementar todavia `Person` como identidad global
- no reemplazar `Resident` por `PatientRecord`
- no implementar portal de familiares
- no implementar pagos ni facturacion
- no hacer todavia el split completo a FHIR-compatible resources

## Corte Recomendado

### Fase 1A Obligatoria

- `Organization`
- `Facility`
- `UserAccount` y `AuthSession` sobre Prisma
- `OrganizationMembership`
- `MembershipFacilityScope`
- agregar `organizationId` y `facilityId` a residentes y medicacion
- scoping por organizacion en backend

### Fase 1B Recomendable Antes De Abrir Staff Multi-Residencia

- persistir `StaffMember` en Prisma
- agregar `organizationId` a staff
- agregar `StaffFacilityAssignment`
- mover gradualmente la nocion operativa de `ward` y `shift` hacia la asignacion

La razon para separar 1A y 1B es pragmatica: el trabajo de tenant foundation y auth no deberia bloquearse por el rediseno completo de staff, pero tampoco conviene cerrar staff como single-facility si ya sabemos que no lo es.

## Decision Principal De Transicion

Para fase 1 conviene mantener los agregados operativos actuales donde ya existen:

- `Resident`
- `ClinicalHistoryEvent`
- `MedicationOrder`
- `MedicationCatalogItem`
- `StaffMember`
- `StaffSchedule`

La base multi-tenant se apoya primero sobre ellos agregando contexto organizacional, y el split mayor hacia `Person` + `PatientRecord` queda para la siguiente gran ola.

## Naming Tecnico Recomendado

### Renombrar En Prisma Pero No Forzar Rename SQL Inmediato

Recomendacion:

- modelar `UserAccount` con `@@map("User")`
- modelar `AuthSession` con `@@map("Session")`

Eso permite usar nombres mejores en codigo sin obligarnos a una migracion fisica de tablas justo al mismo tiempo que metemos multi-tenant.

### Mantener En Fase 1

- `Resident`
- `ClinicalHistoryEvent`
- `StaffMember`
- `StaffSchedule`
- `MedicationCatalogItem`
- `MedicationOrder`

## Modelos Nuevos De Fase 1A

## 1. Organization

Campos recomendados:

- `id String @id @default(uuid()) @db.Uuid`
- `slug String @unique`
- `legalName String`
- `displayName String`
- `status String`
- `timezone String`
- `defaultLocale String`
- auditoria completa

Indices:

- unique en `slug`
- index en `deletedAt`

Estado inicial recomendado:

- una sola organizacion demo creada en seed o data migration

## 2. Facility

Campos recomendados:

- `id String @id @default(uuid()) @db.Uuid`
- `organizationId String @db.Uuid`
- `code String`
- `name String`
- `status String`
- `address Json?`
- `phone String?`
- `email String?`
- `capacity Int?`
- auditoria completa

Relaciones:

- `organization Organization @relation(fields: [organizationId], references: [id], onDelete: Restrict)`

Indices:

- unique compuesto en `[organizationId, code]`
- index en `[organizationId, deletedAt]`

Estado inicial recomendado:

- una residencia demo inicial asociada a la organizacion default

## 3. UserAccount

Implementacion recomendada en Prisma:

- `model UserAccount { ... @@map("User") }`

Campos recomendados:

- los actuales de `User`
- `status String @default("active")`

Campos a mantener:

- `id`
- `fullName`
- `email`
- `password`
- auditoria completa

Campos a deprecatear funcionalmente:

- `role`

No conviene eliminar `role` en la misma migracion que se mete multi-tenant.
Conviene dejarlo como legacy field, dejar de usarlo en auth y removerlo en una fase posterior cuando membership ya sea la fuente de verdad.

Indices:

- unique en `email`
- index en `deletedAt`

## 4. AuthSession

Implementacion recomendada en Prisma:

- `model AuthSession { ... @@map("Session") }`

Campos recomendados:

- los actuales de `Session`
- `activeOrganizationId String? @db.Uuid`
- `activeFacilityId String? @db.Uuid`
- `lastSeenAt DateTime?`

Regla de transicion:

- se agrega primero nullable
- se backfillea con la organizacion default
- despues se vuelve `activeOrganizationId` obligatorio

Relaciones:

- con `UserAccount`
- con `Organization`
- con `Facility`

Indices:

- index en `[userId]`
- index en `[activeOrganizationId]`
- index en `[deletedAt]`

## 5. OrganizationMembership

Campos recomendados:

- `id String @id @default(uuid()) @db.Uuid`
- `organizationId String @db.Uuid`
- `userId String @db.Uuid`
- `roleCode String`
- `status String`
- `isDefault Boolean @default(false)`
- `joinedAt DateTime`
- `leftAt DateTime?`
- auditoria completa

Relaciones:

- con `Organization`
- con `UserAccount`

Indices:

- unique compuesto en `[organizationId, userId]`
- index en `[userId, status]`
- index en `[organizationId, status]`
- index en `deletedAt`

Regla:

- el rol efectivo del usuario en una organizacion sale de aca, no de `User.role`

## 6. MembershipFacilityScope

Campos recomendados:

- `id String @id @default(uuid()) @db.Uuid`
- `membershipId String @db.Uuid`
- `facilityId String @db.Uuid`
- `scopeType String`
- auditoria corta o completa segun preferencia

Indices:

- unique compuesto en `[membershipId, facilityId]`
- index en `[facilityId]`

Regla:

- se usa para limitar a que residencias puede operar ese membership

## Modelos Existentes A Modificar En Fase 1A

## 7. Resident

Campos nuevos recomendados:

- `organizationId String? @db.Uuid`
- `facilityId String? @db.Uuid`

Relaciones nuevas:

- con `Organization`
- con `Facility`

Backfill:

- todos los residentes actuales se asignan a la organizacion default
- todos los residentes actuales se asignan a la facility default

Luego del backfill:

- `organizationId` debe quedar NOT NULL
- `facilityId` debe quedar NOT NULL

Indices recomendados:

- index en `[organizationId, deletedAt]`
- index en `[organizationId, facilityId, deletedAt]`
- si `internalNumber` se vuelve importante, evaluar unique compuesto en `[organizationId, internalNumber]`

Regla operativa:

- mientras exista `Resident` como agregado actual, cada residente tiene una unica residencia operativa activa

## 8. ClinicalHistoryEvent

Campos nuevos recomendados:

- `organizationId String? @db.Uuid`
- `facilityId String? @db.Uuid`

Relaciones nuevas:

- con `Organization`
- con `Facility`

Backfill:

- `organizationId` se deriva del residente
- `facilityId` se deriva del residente actual y puede quedar nullable si no aplica a un evento puntual

Luego del backfill:

- `organizationId` debe quedar NOT NULL
- `facilityId` puede quedar NULL

Indices recomendados:

- index en `[organizationId, residentId, occurredAt]`
- index en `[facilityId, occurredAt]`
- index en `[deletedAt]`

## 9. MedicationOrder

Campos nuevos recomendados:

- `organizationId String? @db.Uuid`
- `facilityId String? @db.Uuid`

Relaciones nuevas:

- con `Organization`
- con `Facility`

Backfill:

- `organizationId` se deriva del residente
- `facilityId` se deriva del residente actual

Luego del backfill:

- ambos deben quedar NOT NULL

Indices recomendados:

- index en `[organizationId, deletedAt]`
- index en `[organizationId, facilityId, deletedAt]`
- index en `[residentId]`
- index en `[medicationCatalogId]`

Regla:

- backend no debe confiar en `organizationId` enviado por frontend
- en create y update se deriva del contexto de sesion y de la residencia destino

## 10. MedicationCatalogItem

Decision recomendada para fase 1:

- se mantiene global
- no se agrega `organizationId` en esta ola

Razon:

- el catalogo global simplifica mucho la migracion
- si a futuro se necesitan overrides por organizacion, se agrega en una fase separada y acotada

## Modelos De Fase 1B

## 11. StaffMember

Como hoy el modulo staff todavia no usa Prisma en runtime, tenemos margen para ordenar su modelo mejor que residentes y medicacion.

Campos recomendados:

- agregar `organizationId String @db.Uuid`
- mantener `firstName`
- mantener `lastName`
- mantener `role`
- mantener `status`
- mantener `startDate`

Campos que conviene considerar legacy o transicionales:

- `ward`
- `shift`

`ward` y `shift` no escalan bien si el staff trabaja en varias residencias.
Conviene moverlos funcionalmente a `StaffFacilityAssignment`, aunque se puedan dejar un tiempo en `StaffMember` para no romper UI de un golpe.

## 12. StaffFacilityAssignment

Tabla nueva recomendada:

- `id String @id @default(uuid()) @db.Uuid`
- `staffId String @db.Uuid`
- `facilityId String @db.Uuid`
- `assignmentRole String?`
- `ward String?`
- `shift String?`
- `startDate DateTime`
- `endDate DateTime?`
- `status String`
- auditoria completa

Indices:

- index en `[staffId, status]`
- index en `[facilityId, status]`
- unique compuesto opcional en `[staffId, facilityId, startDate]`

## 13. StaffSchedule

Decision recomendada:

- no redisenarlo en 1A
- en 1B evaluar mover su FK desde `staffId` hacia `staffFacilityAssignmentId`

Razon:

- el horario suele depender de una asignacion concreta a una residencia
- pero no hace falta bloquear la fundacion multi-tenant por este ajuste

## Reglas De Consistencia Importantes

## Auth

- `AuthSession.activeOrganizationId` debe pertenecer a una membership activa del usuario
- `AuthSession.activeFacilityId`, si existe, debe pertenecer a la misma organizacion activa

## Memberships

- `MembershipFacilityScope.facility.organizationId` debe coincidir con `OrganizationMembership.organizationId`

## Residentes

- `Resident.facility.organizationId` debe coincidir con `Resident.organizationId`

## Eventos Clinicos

- `ClinicalHistoryEvent.organizationId` debe coincidir con `Resident.organizationId`
- si `facilityId` existe, debe pertenecer a esa misma organizacion

## Medicacion

- `MedicationOrder.organizationId` debe coincidir con `Resident.organizationId`
- `MedicationOrder.facilityId` debe pertenecer a esa misma organizacion

Estas reglas no se deben delegar al frontend.
El backend debe derivar o validar el contexto a partir de sesion y relaciones existentes.

## Uniques Y Soft Delete

Hay una tension real entre `soft delete` y unicidad.

Decision recomendada para fase 1:

- mantener uniques duros para:
  - `Organization.slug`
  - `UserAccount.email`
  - `[organizationId, code]` en `Facility`
  - `[organizationId, userId]` en `OrganizationMembership`
  - `[membershipId, facilityId]` en `MembershipFacilityScope`

Tradeoff:

- una fila soft-deleted sigue ocupando la clave unica

Razon:

- Prisma no resuelve uniques parciales de forma ergonomica
- no conviene mezclar fundacion multi-tenant con una estrategia avanzada de filtered unique indexes

Si eso duele despues, se resuelve con migracion SQL puntual.

## Data Migration Recomendada

## Migracion 1

- crear `Organization`
- crear `Facility`
- crear `OrganizationMembership`
- crear `MembershipFacilityScope`
- agregar `activeOrganizationId` y `activeFacilityId` a `Session`
- agregar `organizationId` y `facilityId` nullable a `Resident`
- agregar `organizationId` y `facilityId` nullable a `ClinicalHistoryEvent`
- agregar `organizationId` y `facilityId` nullable a `MedicationOrder`

## Migracion 2

- insertar organizacion default
- insertar facility default
- crear membership default para usuarios actuales
- backfillear sesiones actuales con `activeOrganizationId`
- backfillear residentes con organizacion y facility default
- backfillear eventos clinicos a partir del residente
- backfillear medicacion a partir del residente

## Migracion 3

- volver NOT NULL:
  - `Session.activeOrganizationId`
  - `Resident.organizationId`
  - `Resident.facilityId`
  - `ClinicalHistoryEvent.organizationId`
  - `MedicationOrder.organizationId`
  - `MedicationOrder.facilityId`
- agregar FKs e indices finales faltantes

## Seed De Desarrollo Recomendado

Datos minimos para seed:

- 1 `Organization`
- 1 `Facility`
- 1 `UserAccount`
- 1 `OrganizationMembership` de tipo admin
- residentes, eventos clinicos y medicacion asociados a esa organizacion y facility

Valores sugeridos:

- organization slug: `gentrix-demo`
- organization display name: `Gentrix Demo`
- facility code: `central`
- facility name: `Residencia Central`

## Implicancias Para Backend

- `SessionGuard` debe cargar membership y tenant activo
- el request debe exponer un `AuthContext` con:
  - `userId`
  - `activeOrganizationId`
  - `activeFacilityId`
  - `roleCode`
  - `facilityScopeIds`

- controllers y services no deben aceptar `organizationId` desde frontend
- los repositorios Prisma deben scoper todas las queries por `organizationId`

## Implicancias Para Frontend

- la sesion debe devolver organizacion activa y rol efectivo
- el frontend puede manejar `activeFacilityId` como filtro operativo
- la UI no debe asumir que el usuario ve todas las residencias

## Decisiones Que Conviene Congelar Antes De Implementar

1. si en fase 1 vamos a renombrar los modelos Prisma a `UserAccount` y `AuthSession` usando `@@map`
2. si `StaffMember` entra en 1A o se mueve entero a 1B
3. si `Resident.facilityId` se llama asi en fase 1 o si preferimos `primaryFacilityId`
4. si `Facility.address` se guarda como `Json` al inicio o como campos planos

## Recomendacion Final

Para ejecutar rapido sin hipotecar el futuro:

- hacer 1A completa
- dejar `Resident` como agregado actual con `organizationId` y `facilityId`
- mover auth a Prisma en la misma ola
- hacer staff en 1B inmediatamente despues, antes de exponer multi-residencia de verdad

Ese orden minimiza retrabajo y evita intentar resolver `Person`, familiares y facturacion antes de tener cerrada la base multi-tenant.
