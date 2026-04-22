# Modelo De Dominio

## Proposito

Este documento define el modelo de dominio objetivo de `gentrix`: el norte multi-tenant, las entidades canonicas, su mapeo al codigo actual y lo que queda pendiente.

No describe el estado completo del codigo. El schema real vive en `apps/backend/prisma/schema.prisma`; este archivo explica el porque y la direccion.

Fecha de referencia original: 2026-03-24.

## Resumen Ejecutivo

- El tenant real del sistema es la `Organization`.
- Una organizacion puede operar una o varias `Facility` (residencia o geriatrico).
- El personal pertenece a la organizacion y puede trabajar en ninguna, una o varias residencias.
- El paciente no deberia quedar duplicado por definicion si en el futuro aparece en varias organizaciones.
- El aislamiento operativo y de permisos sigue siendo por organizacion.
- El acceso de familiares se tratara como capacidad de producto de primera clase, no como detalle del contacto de emergencia.
- El diseño debe ser compatible con una futura exposicion FHIR, sin intentar convertir el modelo interno en FHIR puro.

## Terminologia Canonica

- `Organization`: tenant real del sistema.
- `Facility`: residencia o geriatrico que pertenece a una organizacion.
- `Person`: identidad global de una persona dentro de la plataforma.
- `UserAccount`: cuenta de acceso autenticable.
- `OrganizationMembership`: relacion entre un usuario y una organizacion, con rol base y estado.
- `MembershipFacilityScope`: residencias a las que ese membership puede operar.
- `PatientRecord`: ficha del paciente dentro de una organizacion.
- `FacilityStay`: estadia, admision o permanencia de un paciente en una residencia.
- `StaffRecord`: ficha laboral o profesional del personal.
- `StaffFacilityAssignment`: asignacion del personal a residencias.
- `ClinicalEvent`: evento clinico o administrativo append-only sobre el paciente.
- `PatientRelationship`: relacion entre un paciente y una persona vinculada.
- `PatientAccessGrant`: permiso explicito para que una persona vinculada vea o haga algo.
- `BillingResponsibility`: responsabilidad financiera, si aplica.

## Capas Del Modelo

### 1. Identidad Global

Personas y cuentas reutilizables en toda la plataforma.

- `Person`
- `PersonIdentifier`
- `UserAccount`

### 2. Alcance Organizacional

Contexto multi-tenant y control de operacion.

- `Organization`
- `Facility`
- `OrganizationMembership`
- `MembershipFacilityScope`
- `AuthSession`

### 3. Operacion Clinica Y Asistencial

Pacientes, personal, estadias y atenciones.

- `PatientRecord`
- `FacilityStay`
- `ClinicalEvent`
- `StaffRecord`
- `StaffFacilityAssignment`
- `MedicationCatalogItem`
- `MedicationOrder`
- `MedicationExecution`

### 4. Familiares, Autorizaciones Y Cobranza

Requeridas para portal de familiares y pagos sin rehacer el modelo.

- `PatientRelationship`
- `PatientAccessGrant`
- `BillingResponsibility`
- `Invoice`

## Reglas Transversales

- Seguridad y aislamiento: por `organizationId`.
- Operacion diaria: por `facilityId`.
- Soft delete general con `createdAt/By`, `updatedAt/By`, `deletedAt/By`.
- IDs tecnicos UUID.
- Backend no debe confiar en `organizationId` enviado por frontend: se deriva del contexto de sesion.
- `Person` (cuando exista) no otorga acceso por si sola; la operacion cuelga de registros por organizacion.

## Entidades Canonicas

### Organization

Representa al tenant real.

Campos clave: `id`, `slug` unico, `legalName`, `displayName`, `taxId?`, `status`, `timezone`, `defaultLocale`, auditoria.

Relaciones: 1:N con `Facility`, `OrganizationMembership`, `PatientRecord`, `StaffRecord`, `Invoice`.

### Facility

Residencia o geriatrico dentro de una organizacion.

Campos clave: `id`, `organizationId`, `code`, `name`, `status`, `address?`, `phone?`, `email?`, `capacity?`, auditoria.

Unique compuesto: `[organizationId, code]`.

Relaciones: N:1 con `Organization`; 1:N con `FacilityStay`, `StaffFacilityAssignment`; N:M con `OrganizationMembership` via `MembershipFacilityScope`.

### Person

Identidad base de una persona. No otorga acceso por si sola.

Campos clave: `id`, `legalFirstName`, `legalLastName`, `preferredName?`, `birthDate?`, `sex?`, `nationality?`, `primaryEmail?`, `primaryPhone?`, `status`, auditoria.

Relaciones: 1:N con `PersonIdentifier`; 1:0..1 con `UserAccount`; 1:N con `PatientRecord`, `StaffRecord`; N:M consigo misma via `PatientRelationship`.

### PersonIdentifier

Identificadores fuertes o externos de una persona.

Campos clave: `id`, `personId`, `system` (`dni`, `cuil`, `passport`, `external-mrn`), `value`, `normalizedValue`, `issuingCountry?`, `isPrimary`, `verifiedAt?`.

`normalizedValue` es clave para futura deduplicacion.

### UserAccount

Cuenta autenticable asociada a una persona.

Campos clave: `id`, `personId`, `email` unico, `passwordHash`, `status`, `lastLoginAt?`, `passwordChangedAt?`, auditoria.

Los roles **no** viven aqui: viven en `OrganizationMembership`.

### OrganizationMembership

Relacion entre una cuenta y una organizacion.

Campos clave: `id`, `organizationId`, `userId`, `roleId` (FK a `Role`), `status`, `isDefault`, `joinedAt`, `leftAt?`, auditoria.

Unique compuesto: `[organizationId, userId]`.

Un usuario puede tener memberships en varias organizaciones.

### MembershipFacilityScope

Alcance operativo de un membership dentro de una o varias residencias.

Campos clave: `id`, `membershipId`, `facilityId`, `scopeType` (`assigned`, `managed`, `read-only`).

Unique compuesto: `[membershipId, facilityId]`.

La ausencia de scopes explicitos puede significar acceso global a la organizacion segun rol.

### AuthSession

Sesion persistida del usuario.

Campos clave: `token`, `userId`, `activeOrganizationId`, `activeFacilityId?`, `expiresAt`, `lastSeenAt?`, `revokedAt?`, auditoria.

Reglas de consistencia:

- `activeOrganizationId` debe pertenecer a una membership activa del usuario.
- `activeFacilityId`, si existe, debe pertenecer a esa misma organizacion.

### PatientRecord

Ficha del paciente dentro de una organizacion.

Campos clave: `id`, `organizationId`, `personId`, `localChartNumber?`, `internalNumber?`, `procedureNumber?`, `status`, `primaryFacilityId?`, campos clinicos JSON (`insurance`, `transfer`, `psychiatry`, `clinicalProfile`, `belongings`, `discharge`), auditoria.

Relaciones: N:1 con `Organization` y `Person`; 1:N con `FacilityStay`, `ClinicalEvent`, `MedicationOrder`, `PatientAccessGrant`, `BillingResponsibility`.

Regla: la identidad demografica base vive en `Person`; `PatientRecord` guarda el contexto local.

### FacilityStay

Estadia, ingreso, traslado o permanencia en una residencia.

Campos clave: `id`, `patientRecordId`, `facilityId`, `startDate`, `endDate?`, `room?`, `bed?`, `careLevel`, `status`, `admissionReason?`, `dischargeReason?`.

V1 recomendada: una sola estadia activa principal por paciente dentro de una organizacion. El historial de traslados vive aqui, no sobrescribiendo la misma fila.

### ClinicalEvent

Evento clinico o administrativo append-only sobre el paciente.

Campos clave: `id`, `patientRecordId`, `facilityId?`, `eventType`, `title`, `description`, `occurredAt`, `visibilityLevel`, auditoria.

Regla: modelo append-only. `visibilityLevel` deja abierta la puerta a resumir o no ciertos eventos para familiares.

### StaffRecord

Ficha del personal dentro de una organizacion.

Campos clave: `id`, `organizationId`, `personId`, `employmentType?`, `professionalRole`, `licenseNumber?`, `status`, `hireDate?`, `endDate?`, auditoria.

Un mismo `Person` puede tener mas de un `StaffRecord` en organizaciones distintas.

### StaffFacilityAssignment

Asignacion del personal a residencias concretas.

Campos clave: `id`, `staffRecordId`, `facilityId`, `assignmentRole?`, `shift?`, `startDate`, `endDate?`, `status`.

Permite staff sin residencia fija y rotando por varias residencias.

### PatientRelationship

Relacion entre el paciente y otra persona vinculada.

Campos clave: `id`, `patientPersonId`, `relatedPersonId`, `relationshipType`, `isEmergencyContact`, `isPrimaryContact`, `notes?`.

Regla: no otorga permisos de acceso por si misma. Reemplaza conceptualmente a `familyContacts`.

### PatientAccessGrant

Permiso explicito para que una persona relacionada acceda a informacion o ejecute acciones.

Campos clave: `id`, `organizationId`, `patientRecordId`, `relatedPersonId`, `grantType`, `status`, `startsAt?`, `endsAt?`, `grantedBy`.

Ejemplos de `grantType`: `patient.summary.read`, `patient.documents.read`, `billing.read`, `billing.pay`, `patient.messages.send`, `consents.sign`.

Reglas: el parentesco no implica acceso automatico; el grant debe ser auditable y revocable.

### BillingResponsibility

Responsable financiero de un paciente en una organizacion.

Campos clave: `id`, `organizationId`, `patientRecordId`, `relatedPersonId`, `responsibilityType`, `status`, `notes?`.

Regla: no toda persona con acceso clinico tiene responsabilidad financiera y viceversa.

### Invoice

Documento de cobranza asociado a un paciente o a su responsable.

Campos clave: `id`, `organizationId`, `patientRecordId`, `billingResponsibilityId?`, `facilityId?`, `periodStart`, `periodEnd`, `currency`, `amountCents`, `status`, `issuedAt`, `dueAt`, `paidAt?`.

### MedicationCatalogItem

Catalogo de medicamentos, direccion recomendada global y compartido.

Campos clave: `id`, `scopeType`, `organizationId?`, `medicationName`, `activeIngredient?`, `status`.

Posibilidad futura de overrides por organizacion si negocio lo necesita.

### MedicationOrder

Orden de medicacion vigente para un paciente.

Campos clave: `id`, `organizationId`, `patientRecordId`, `facilityId`, `medicationCatalogItemId`, `prescribedByStaffRecordId?`, `medicationName`, `dose`, `route`, `frequency`, `scheduleTimes`, `startDate`, `endDate?`, `status`.

Regla: `scheduleTimes` son horarios planificados. No son prueba de ejecucion.

### MedicationExecution

Ejecucion concreta de una dosis durante un turno.

Campos clave: `id`, `organizationId`, `facilityId`, `medicationOrderId`, `residentId` o `patientRecordId`, `result` (`administered`, `omitted`, `rejected`), `occurredAt`, `actor`, `notes?`.

Regla: administracion, omision y rechazo se modelan aqui, no como campos adicionales dentro de `MedicationOrder`.

## RBAC

RBAC no debe vivir en `User` como string global.

- El catálogo de roles por organización vive en `Role` (`code`, `displayName`, `description`), con unicidad `[organizationId, code]` — 3FN.
- El rol efectivo de un usuario en una organización se referencia desde `OrganizationMembership.roleId` (FK a `Role`).
- El alcance por residencia vive en `MembershipFacilityScope`.
- Los permisos efectivos se resuelven por organizacion y, cuando aplique, por residencia.

Ejemplos iniciales: `org_admin`, `org_coordinator`, `facility_manager`, `clinical_staff`, `family_portal_user`, `billing_contact`, `read_only`.

La definicion fina de permisos queda pendiente, pero el modelo debe permitir rol base organizacional, alcance opcional por residencia y grants explicitos para familiares o terceros.

## FHIR

FHIR es objetivo de compatibilidad, no el modelo interno obligado.

Mapeo conceptual deseado:

- `Organization` → FHIR `Organization`
- `Facility` → FHIR `Location`
- `Person` → FHIR `Person`
- paciente operativo → FHIR `Patient`
- familiar o responsable → FHIR `RelatedPerson`
- personal → FHIR `Practitioner`
- rol del personal por sede → FHIR `PractitionerRole`
- estadia o tramo asistencial → FHIR `EpisodeOfCare`
- atencion concreta → FHIR `Encounter`

Regla: no diseñar la base como si todo fuese FHIR desde el primer dia; si diseñar el dominio de modo que un mapeo a FHIR sea natural.

## Mapeo Desde El Modelo Actual

Nombres tecnicos reales en Prisma hoy vs. modelo objetivo:

- `User` (mapeado a `UserAccount`) → `UserAccount` efectivo; falta `personId`.
- `Session` (mapeado a `AuthSession`) → `AuthSession` efectivo.
- `Resident` → hoy es el agregado operativo completo; direccion: split en `Person` + `PatientRecord` + `FacilityStay`.
- `ClinicalHistoryEvent` → `ClinicalEvent`.
- `ResidentObservationNote` → simplificacion operativa actual; se evaluara su evolucion.
- `StaffMember` → `StaffRecord`.
- `StaffSchedule` → subentidad de `StaffFacilityAssignment` o `StaffRecord`.
- `MedicationCatalogItem` → se mantiene; agregar `scopeType` y `organizationId?` a futuro.
- `MedicationOrder` → agregar `prescribedByStaffRecordId` y evolucionar de `residentId` a `patientRecordId`.
- `MedicationExecution` → ya implementado; el contrato de resultado sigue evolucionando.
- `familyContacts` JSON en `Resident` → `PatientRelationship` + `PatientAccessGrant`.

## Estado De Implementacion

### Ya implementado en schema

- `Organization`, `Facility`
- `UserAccount` (Prisma) con `@@map("User")`
- `AuthSession` (Prisma) con `@@map("Session")`, `activeOrganizationId` obligatorio, `activeFacilityId` opcional
- `OrganizationMembership`, `MembershipFacilityScope`
- `Resident` con `organizationId` y `facilityId` NOT NULL, campo `careStatus`, auditoria completa
- `ClinicalHistoryEvent` con `organizationId` obligatorio
- `MedicationOrder` con `organizationId` y `facilityId`
- `MedicationExecution` con `result`, `occurredAt`, link a orden y residente
- `StaffMember` con `organizationId`
- `StaffFacilityAssignment`, `StaffSchedule`
- `ResidentAgendaEvent`, `ResidentAgendaSeries`, `ResidentAgendaSeriesException` (agenda operativa recurrente)
- `ResidentObservationNote` (nota operativa simple)
- `PasswordResetAudit` (auditoria de reset de passwords)
- Soft delete general con `createdAt/By`, `updatedAt/By`, `deletedAt/By`

### Pendiente (segunda ola o posterior)

- `Person`, `PersonIdentifier` como identidad global
- `PatientRecord` como reemplazo formal del `Resident`
- `FacilityStay` como tabla propia de estadias
- `PatientRelationship`, `PatientAccessGrant`
- `BillingResponsibility`, `Invoice`
- Eliminar `User.role` legacy una vez que membership sea la unica fuente de rol
- Resolver uniques parciales para conciliar soft delete con unicidad
- Mapeos concretos a FHIR

## Principios De Acceso Para Familiares

- Ser familiar no implica acceso automatico.
- El acceso debe ser explicito y auditable.
- Los permisos deben estar scopeados por paciente y por organizacion.
- Una persona relacionada puede estar asociada a mas de un paciente.
- Una misma persona relacionada puede tener distintos permisos segun la organizacion o el paciente.

## Decisiones Abiertas

- Estrategia exacta de deduplicacion y merge de `Person`.
- Politica de identificadores fuertes.
- Modelo financiero detallado para pagos de estadia.
- Matriz exacta de permisos finos.
- Alcance de la primera integracion FHIR.
- Si `Facility.address` se mantiene como JSON o se normaliza.
- Si la historia financiera queda en el mismo bounded context o en uno separado.
