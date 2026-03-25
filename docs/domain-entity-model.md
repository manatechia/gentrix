# Modelo De Entidades Propuesto

## Proposito

Este documento baja a entidades concretas el norte definido en `docs/multitenancy-rbac-domain-north.md`.
El objetivo es tener un modelo suficientemente estable para guiar Prisma, RBAC y futuras capacidades como portal de familiares, pagos e integracion compatible con FHIR.

Fecha de referencia: 2026-03-24.

## Criterios De Modelado

- El tenant real es `Organization`.
- La residencia o geriatrico se modela como `Facility`.
- La identidad base de una persona no deberia quedar acoplada a una sola organizacion.
- Los datos operativos, permisos y acceso deben seguir aislados por organizacion.
- El personal y los pacientes no deben quedar atados a una sola residencia por definicion.
- Los familiares con acceso no se modelan solo como contacto embebido.

## Capas Del Modelo

### 1. Identidad Global

Entidades que representan personas o cuentas de acceso reutilizables en toda la plataforma.

- `Person`
- `PersonIdentifier`
- `UserAccount`

### 2. Alcance Organizacional

Entidades que dan contexto multi-tenant y controlan a que organizacion y residencia puede operar alguien.

- `Organization`
- `Facility`
- `OrganizationMembership`
- `MembershipFacilityScope`
- `AuthSession`

### 3. Operacion Clinica Y Asistencial

Entidades que representan pacientes, personal, estadias y atenciones.

- `PatientRecord`
- `FacilityStay`
- `ClinicalEvent`
- `StaffRecord`
- `StaffFacilityAssignment`
- `MedicationCatalogItem`
- `MedicationOrder`

### 4. Familiares, Autorizaciones Y Cobranza

Entidades necesarias para abrir portal de familiares y pagos sin rehacer el modelo.

- `PatientRelationship`
- `PatientAccessGrant`
- `BillingResponsibility`
- `Invoice`

## Entidades Canonicas

## 1. Organization

Representa al tenant real.

Campos sugeridos:

- `id`
- `slug`
- `legalName`
- `displayName`
- `taxId` opcional
- `status`
- `timezone`
- `defaultLocale`
- `createdAt`
- `createdBy`
- `updatedAt`
- `updatedBy`
- `deletedAt`
- `deletedBy`

Relaciones:

- 1:N con `Facility`
- 1:N con `OrganizationMembership`
- 1:N con `PatientRecord`
- 1:N con `StaffRecord`
- 1:N con `Invoice`

Reglas:

- `slug` debe ser unico.
- Toda seguridad de datos parte de `organizationId`.

## 2. Facility

Representa una residencia o geriatrico dentro de una organizacion.

Campos sugeridos:

- `id`
- `organizationId`
- `code`
- `name`
- `status`
- `address` como JSON o entidad separada segun necesidad
- `phone` opcional
- `email` opcional
- `capacity` opcional
- `createdAt`
- `createdBy`
- `updatedAt`
- `updatedBy`
- `deletedAt`
- `deletedBy`

Relaciones:

- N:1 con `Organization`
- 1:N con `FacilityStay`
- 1:N con `StaffFacilityAssignment`
- N:M con `OrganizationMembership` via `MembershipFacilityScope`

Reglas:

- `code` debe ser unico dentro de la organizacion.
- La ocupacion y la operacion diaria cuelgan de `facilityId`.

## 3. Person

Representa la identidad base de una persona en la plataforma.

Campos sugeridos:

- `id`
- `legalFirstName`
- `legalMiddleNames` opcional
- `legalLastName`
- `legalOtherLastNames` opcional
- `preferredName` opcional
- `birthDate` opcional
- `sex` opcional
- `nationality` opcional
- `primaryEmail` opcional
- `primaryPhone` opcional
- `status`
- `createdAt`
- `createdBy`
- `updatedAt`
- `updatedBy`
- `deletedAt`
- `deletedBy`

Relaciones:

- 1:N con `PersonIdentifier`
- 1:0..1 con `UserAccount`
- 1:N con `PatientRecord`
- 1:N con `StaffRecord`
- N:M consigo misma via `PatientRelationship`

Reglas:

- `Person` no otorga acceso por si sola.
- La existencia global de `Person` no rompe aislamiento multi-tenant porque la operacion cuelga de registros por organizacion.

## 4. PersonIdentifier

Identificadores fuertes o externos de una persona.

Campos sugeridos:

- `id`
- `personId`
- `system`
- `value`
- `normalizedValue`
- `issuingCountry` opcional
- `isPrimary`
- `verifiedAt` opcional
- `createdAt`
- `createdBy`
- `updatedAt`
- `updatedBy`

Ejemplos de `system`:

- `dni`
- `cuil`
- `passport`
- `external-mrn`

Reglas:

- La estrategia de unicidad fuerte queda pendiente, pero el modelo debe soportarla.
- `normalizedValue` es clave para futura deduplicacion.

## 5. UserAccount

Cuenta autenticable asociada a una persona.

Campos sugeridos:

- `id`
- `personId`
- `email`
- `passwordHash`
- `status`
- `lastLoginAt` opcional
- `passwordChangedAt` opcional
- `createdAt`
- `createdBy`
- `updatedAt`
- `updatedBy`
- `deletedAt`
- `deletedBy`

Relaciones:

- 1:1 con `Person`
- 1:N con `OrganizationMembership`
- 1:N con `AuthSession`

Reglas:

- `email` unico.
- Los roles no viven aqui.

## 6. OrganizationMembership

Relacion entre una cuenta y una organizacion.

Campos sugeridos:

- `id`
- `organizationId`
- `userAccountId`
- `roleCode`
- `status`
- `isDefault`
- `joinedAt`
- `leftAt` opcional
- `createdAt`
- `createdBy`
- `updatedAt`
- `updatedBy`
- `deletedAt`
- `deletedBy`

Relaciones:

- N:1 con `Organization`
- N:1 con `UserAccount`
- 1:N con `MembershipFacilityScope`

Reglas:

- Los roles base de RBAC viven aqui.
- Un usuario puede tener memberships en varias organizaciones.

## 7. MembershipFacilityScope

Define el alcance operativo de un membership dentro de una o varias residencias.

Campos sugeridos:

- `id`
- `membershipId`
- `facilityId`
- `scopeType`
- `createdAt`
- `createdBy`
- `updatedAt`
- `updatedBy`

Ejemplos de `scopeType`:

- `assigned`
- `managed`
- `read-only`

Reglas:

- La ausencia de scopes explicitos puede significar acceso global a la organizacion solo para ciertos roles.
- La logica exacta se define en RBAC.

## 8. AuthSession

Sesion persistida del usuario.

Campos sugeridos:

- `id` o `token`
- `userAccountId`
- `activeOrganizationId`
- `activeFacilityId` opcional
- `expiresAt`
- `lastSeenAt`
- `revokedAt` opcional
- `createdAt`
- `createdBy`
- `updatedAt`
- `updatedBy`

Relaciones:

- N:1 con `UserAccount`
- N:1 con `Organization`
- N:0..1 con `Facility`

Reglas:

- `activeOrganizationId` es obligatorio una vez que exista multi-tenant.
- `activeFacilityId` funciona como contexto o filtro de trabajo, no como unica barrera de seguridad.

## 9. PatientRecord

Ficha del paciente dentro de una organizacion.

Campos sugeridos:

- `id`
- `organizationId`
- `personId`
- `localChartNumber` opcional
- `internalNumber` opcional
- `procedureNumber` opcional
- `status`
- `primaryFacilityId` opcional
- `insurance` JSON inicial
- `transfer` JSON inicial
- `psychiatry` JSON inicial
- `clinicalProfile` JSON inicial
- `belongings` JSON inicial
- `discharge` JSON inicial
- `createdAt`
- `createdBy`
- `updatedAt`
- `updatedBy`
- `deletedAt`
- `deletedBy`

Relaciones:

- N:1 con `Organization`
- N:1 con `Person`
- N:0..1 con `Facility` como residencia primaria
- 1:N con `FacilityStay`
- 1:N con `ClinicalEvent`
- 1:N con `MedicationOrder`
- 1:N con `PatientAccessGrant`
- 1:N con `BillingResponsibility`

Reglas:

- La identidad demografica base debe vivir en `Person`.
- `PatientRecord` guarda el contexto local del paciente dentro de la organizacion.

## 10. FacilityStay

Estadia, ingreso, traslado o permanencia de un paciente en una residencia.

Campos sugeridos:

- `id`
- `patientRecordId`
- `facilityId`
- `startDate`
- `endDate` opcional
- `room` opcional
- `bed` opcional
- `careLevel`
- `status`
- `admissionReason` opcional
- `dischargeReason` opcional
- `createdAt`
- `createdBy`
- `updatedAt`
- `updatedBy`
- `deletedAt`
- `deletedBy`

Relaciones:

- N:1 con `PatientRecord`
- N:1 con `Facility`

Reglas:

- V1 recomendada: una sola estadia activa principal por paciente dentro de una organizacion.
- El historial de traslados vive aqui, no sobrescribiendo el mismo registro.

## 11. ClinicalEvent

Evento clinico o administrativo append-only sobre el paciente.

Campos sugeridos:

- `id`
- `patientRecordId`
- `facilityId` opcional
- `eventType`
- `title`
- `description`
- `occurredAt`
- `visibilityLevel`
- `createdAt`
- `createdBy`
- `updatedAt`
- `updatedBy`
- `deletedAt`
- `deletedBy`

Relaciones:

- N:1 con `PatientRecord`
- N:0..1 con `Facility`

Reglas:

- Debe seguir modelo append-only.
- `visibilityLevel` deja abierta la puerta a resumir o no ciertos eventos para familiares.

## 12. StaffRecord

Ficha del personal dentro de una organizacion.

Campos sugeridos:

- `id`
- `organizationId`
- `personId`
- `employmentType` opcional
- `professionalRole`
- `licenseNumber` opcional
- `status`
- `hireDate` opcional
- `endDate` opcional
- `createdAt`
- `createdBy`
- `updatedAt`
- `updatedBy`
- `deletedAt`
- `deletedBy`

Relaciones:

- N:1 con `Organization`
- N:1 con `Person`
- 1:N con `StaffFacilityAssignment`

Reglas:

- Un mismo `Person` puede tener mas de un `StaffRecord` en organizaciones distintas.

## 13. StaffFacilityAssignment

Asignacion del personal a residencias concretas.

Campos sugeridos:

- `id`
- `staffRecordId`
- `facilityId`
- `assignmentRole` opcional
- `shift` opcional
- `startDate`
- `endDate` opcional
- `status`
- `createdAt`
- `createdBy`
- `updatedAt`
- `updatedBy`
- `deletedAt`
- `deletedBy`

Relaciones:

- N:1 con `StaffRecord`
- N:1 con `Facility`

Reglas:

- Permite staff sin residencia fija y staff rotando por varias residencias.

## 14. PatientRelationship

Relacion entre el paciente y otra persona vinculada.

Campos sugeridos:

- `id`
- `patientPersonId`
- `relatedPersonId`
- `relationshipType`
- `isEmergencyContact`
- `isPrimaryContact`
- `notes` opcional
- `createdAt`
- `createdBy`
- `updatedAt`
- `updatedBy`
- `deletedAt`
- `deletedBy`

Relaciones:

- N:1 con `Person` como paciente
- N:1 con `Person` como relacionado

Reglas:

- No otorga permisos de acceso por si misma.
- Reemplaza conceptualmente a `familyContacts` como modelo objetivo.

## 15. PatientAccessGrant

Permiso explicito para que una persona relacionada acceda a informacion o ejecute acciones.

Campos sugeridos:

- `id`
- `organizationId`
- `patientRecordId`
- `relatedPersonId`
- `grantType`
- `status`
- `startsAt` opcional
- `endsAt` opcional
- `grantedBy`
- `createdAt`
- `createdBy`
- `updatedAt`
- `updatedBy`
- `deletedAt`
- `deletedBy`

Ejemplos de `grantType`:

- `patient.summary.read`
- `patient.documents.read`
- `billing.read`
- `billing.pay`

Reglas:

- El parentesco no debe implicar acceso automatico.
- El grant debe ser auditable y revocable.

## 16. BillingResponsibility

Define quien es responsable financiero de un paciente en una organizacion.

Campos sugeridos:

- `id`
- `organizationId`
- `patientRecordId`
- `relatedPersonId`
- `responsibilityType`
- `status`
- `notes` opcional
- `createdAt`
- `createdBy`
- `updatedAt`
- `updatedBy`
- `deletedAt`
- `deletedBy`

Reglas:

- No toda persona con acceso clinico tiene responsabilidad financiera.
- No toda persona responsable financiera debe ver toda la informacion clinica.

## 17. Invoice

Documento de cobranza asociado a un paciente o a su responsable.

Campos sugeridos:

- `id`
- `organizationId`
- `patientRecordId`
- `billingResponsibilityId` opcional
- `facilityId` opcional
- `periodStart`
- `periodEnd`
- `currency`
- `amountCents`
- `status`
- `issuedAt`
- `dueAt`
- `paidAt` opcional
- `createdAt`
- `createdBy`
- `updatedAt`
- `updatedBy`

Relaciones:

- N:1 con `Organization`
- N:1 con `PatientRecord`
- N:0..1 con `BillingResponsibility`
- N:0..1 con `Facility`

## 18. MedicationCatalogItem

Catalogo de medicamentos.

Direccion recomendada para v1:

- catalogo global compartido
- con posibilidad futura de overrides por organizacion si negocio lo necesita

Campos sugeridos:

- `id`
- `scopeType`
- `organizationId` opcional
- `medicationName`
- `activeIngredient` opcional
- `status`
- `createdAt`
- `createdBy`
- `updatedAt`
- `updatedBy`
- `deletedAt`
- `deletedBy`

## 19. MedicationOrder

Orden de medicacion de un paciente.

Campos sugeridos:

- `id`
- `organizationId`
- `patientRecordId`
- `facilityId`
- `medicationCatalogItemId`
- `prescribedByStaffRecordId` opcional
- `medicationName`
- `dose`
- `route`
- `frequency`
- `scheduleTimes`
- `startDate`
- `endDate` opcional
- `status`
- `createdAt`
- `createdBy`
- `updatedAt`
- `updatedBy`
- `deletedAt`
- `deletedBy`

Relaciones:

- N:1 con `Organization`
- N:1 con `PatientRecord`
- N:1 con `Facility`
- N:1 con `MedicationCatalogItem`
- N:0..1 con `StaffRecord`

## Relaciones Clave

- `Organization` 1:N `Facility`
- `Person` 1:0..1 `UserAccount`
- `UserAccount` 1:N `OrganizationMembership`
- `OrganizationMembership` 1:N `MembershipFacilityScope`
- `Organization` 1:N `PatientRecord`
- `Person` 1:N `PatientRecord`
- `PatientRecord` 1:N `FacilityStay`
- `PatientRecord` 1:N `ClinicalEvent`
- `Organization` 1:N `StaffRecord`
- `Person` 1:N `StaffRecord`
- `StaffRecord` 1:N `StaffFacilityAssignment`
- `Person` N:M `Person` via `PatientRelationship`
- `PatientRecord` 1:N `PatientAccessGrant`
- `PatientRecord` 1:N `BillingResponsibility`
- `PatientRecord` 1:N `Invoice`
- `PatientRecord` 1:N `MedicationOrder`

## Mapeo Desde El Modelo Actual

Modelo actual:

- `User`
- `Session`
- `Resident`
- `ClinicalHistoryEvent`
- `StaffMember`
- `StaffSchedule`
- `MedicationCatalogItem`
- `MedicationOrder`

Direccion de evolucion:

- `User` -> `UserAccount`
- `Session` -> `AuthSession`
- `Resident` -> primera etapa `Resident` con `organizationId` y `facilityId`; modelo objetivo `Person` + `PatientRecord` + `FacilityStay`
- `ClinicalHistoryEvent` -> `ClinicalEvent`
- `StaffMember` -> `StaffRecord`
- `StaffSchedule` -> puede seguir como subentidad de `StaffFacilityAssignment` o quedar asociada a `StaffRecord`
- `MedicationCatalogItem` -> se mantiene, agregando `scopeType` y futuro `organizationId` opcional
- `MedicationOrder` -> agregar `organizationId` y evolucionar de `residentId` a `patientRecordId`

## Corte Recomendado Para Implementacion V1

### Entra En La Primera Ola

- `Organization`
- `Facility`
- `UserAccount`
- `AuthSession` persistida en Prisma
- `OrganizationMembership`
- `MembershipFacilityScope`
- `organizationId` y `facilityId` en entidades operativas actuales

### Se Puede Mantener Transicionalmente

- `Resident` como agregado operativo actual, mientras se prepara el split posterior hacia `Person` + `PatientRecord`
- `familyContacts` como captura de datos basica, sabiendo que no es el modelo final para acceso de familiares

### Conviene Diferir A Segunda Ola

- `Person`
- `PersonIdentifier`
- `PatientRecord` como reemplazo formal del `Resident`
- `PatientRelationship`
- `PatientAccessGrant`
- `BillingResponsibility`
- `Invoice`

## Decisiones Abiertas

- si `Person` se implementa desde el primer corte o en una segunda migracion
- reglas exactas de deduplicacion y merge de personas
- modelo final de permisos para familiares
- separacion exacta entre datos clinicos visibles y no visibles para familiares
- si la historia financiera queda en el mismo bounded context o en uno separado
