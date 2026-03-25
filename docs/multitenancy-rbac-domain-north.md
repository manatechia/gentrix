# Norte De Dominio Para Multi-Tenant, RBAC Y Acceso De Familiares

## Proposito

Este documento fija el norte de dominio para la siguiente etapa de `gentrix`.
No describe el estado actual del codigo, sino la direccion deseada para evitar migraciones grandes y decisiones que despues bloqueen multi-organizacion, RBAC, portal de familiares o integracion futura con FHIR.

Para una propuesta mas concreta de entidades, campos y relaciones, ver `docs/domain-entity-model.md`.

Fecha de referencia: 2026-03-24.

## Resumen Ejecutivo

- El tenant real sera la `Organization`.
- Una organizacion puede operar una o varias `Facility`.
- En UI y negocio, `Facility` representa una residencia o geriatrico.
- El personal pertenece a la organizacion y puede trabajar en ninguna, una o varias residencias.
- El paciente no deberia quedar duplicado por definicion si en el futuro aparece en varias organizaciones.
- El aislamiento operativo y de permisos seguira siendo por organizacion.
- El acceso de familiares se tratara como capacidad de producto de primera clase, no como un detalle del contacto de emergencia.
- El diseño debe ser compatible con una futura exposicion o integracion FHIR, sin intentar convertir el modelo interno en FHIR puro.

## Terminologia Canonica

- `Organization`: tenant real del sistema.
- `Facility`: residencia o geriatrico que pertenece a una organizacion.
- `Person`: identidad global de una persona dentro de la plataforma.
- `UserAccount`: cuenta de acceso autenticable para una persona.
- `OrganizationMembership`: relacion entre un usuario y una organizacion, con rol base y estado.
- `FacilityAccessScope`: residencias a las que un usuario puede operar dentro de una organizacion.
- `PatientRecord`: ficha del paciente dentro del contexto asistencial y administrativo de una organizacion.
- `FacilityStay`: estadia, admision o permanencia de un paciente en una residencia.
- `StaffProfile`: ficha laboral o profesional del personal.
- `StaffFacilityAssignment`: asignacion del personal a una o varias residencias.
- `RelatedPerson`: persona vinculada a un paciente, por ejemplo familiar, apoderado o responsable.
- `PatientRelationship`: relacion entre un paciente y una persona vinculada.
- `AccessGrant`: permiso explicito para que una persona vinculada vea informacion o ejecute acciones.

## Estado Actual Del Codigo

Hoy el repo guarda contactos familiares como datos embebidos dentro del residente:

- `Resident.familyContacts`
- `Resident.emergencyContact`

Eso sirve para captura operativa basica, pero mezcla tres conceptos distintos:

1. informacion de contacto
2. identidad de la persona relacionada
3. permisos reales para actuar o ver informacion

Por eso ese modelo no alcanza para:

- portal de familiares
- pagos de estadia
- consentimiento o autorizaciones
- auditoria de accesos
- reutilizar a la misma persona vinculada en mas de un paciente
- evitar duplicacion de personas entre organizaciones

Conclusion: `familyContacts` y `emergencyContact` deben considerarse un modelo transicional de captura, no el modelo objetivo.

## Tenancy Y Alcance Operativo

### Tenant Real

El tenant del sistema sera la `Organization`.

La seguridad de backend, la sesion activa y el aislamiento de datos se resolveran primero por organizacion.

### Residencias

Una `Organization` puede tener una o varias `Facility`.

`Facility` es el nombre tecnico recomendado porque envejece mejor en codigo y deja margen si el negocio expande el tipo de sede.
En UI se puede seguir mostrando "Residencia" o "Geriatrico".

### Regla Operativa

- seguridad y aislamiento: por `organizationId`
- operacion diaria: por `facilityId`

Eso permite:

- admins que vean toda la organizacion
- coordinadores limitados a ciertas residencias
- reportes agregados por organizacion
- ocupacion y operacion diaria por residencia

## Identidad De Personas, Pacientes Y Personal

### Persona Global

Para no cerrar la puerta a que un mismo paciente aparezca en varias organizaciones sin duplicarlo por definicion, la identidad base debe separarse del tenant.

La entidad propuesta es `Person`.

`Person` representa a una persona unica en toda la plataforma y puede ser:

- paciente
- familiar o responsable
- miembro del personal
- usuario con acceso

Esto no implica que todas las organizaciones compartan libremente informacion entre si.
La identidad puede ser global y, al mismo tiempo, los datos operativos seguir aislados por organizacion.

### Paciente

El paciente no debe quedar atado directamente a una sola residencia ni a una sola organizacion como identidad.

Direccion recomendada:

- `Person`: identidad global de la persona
- `PatientRecord`: ficha asistencial y administrativa de esa persona dentro de una organizacion
- `FacilityStay`: estadias, admisiones, traslados o presencia operativa en una residencia

Regla propuesta para v1:

- una persona puede tener multiples `PatientRecord` si el negocio realmente necesita operar esa persona en organizaciones distintas
- dentro de una organizacion, la operacion diaria debe apoyarse en una unica estadia activa principal por vez

Con esto se evita:

- duplicar identidad por residencia
- bloquear un futuro escenario multi-organizacion
- mezclar historial clinico con ocupacion diaria

### Personal

El personal tampoco debe quedar reducido a una sola residencia.

Direccion recomendada:

- `Person`: identidad global
- `StaffProfile`: datos laborales o profesionales
- `OrganizationMembership`: pertenencia a la organizacion
- `StaffFacilityAssignment`: residencias y periodos en los que trabaja

Esto cubre:

- personal administrativo sin residencia fija
- personal clinico que rota por varias residencias
- coordinadores con alcance organizacional

## Familiares, Responsables Y Portal Externo

### Problema Del Modelo Actual

Hoy un familiar esta modelado como un objeto embebido dentro del paciente.
Eso sirve para mostrar telefono, parentesco y direccion, pero no para representar a una persona con derechos y acciones concretas.

### Separacion Necesaria

Para soportar portal de familiares y pagos, hay que separar:

- la persona
- la relacion con el paciente
- el permiso concreto
- la responsabilidad financiera

### Modelo Recomendado

- `RelatedPerson`: identidad de la persona relacionada con el paciente
- `PatientRelationship`: parentesco o relacion con el paciente
- `AccessGrant`: permiso explicito dentro de una organizacion para ver o hacer cosas
- `BillingResponsibility`: responsabilidad financiera, si aplica

Ejemplos de cosas que no conviene seguir mezclando en `familyContacts`:

- contacto de emergencia
- hija con acceso solo a ver resumen clinico
- hijo con permiso para pagar la estadia
- apoderado con capacidad de firmar o autorizar
- tutor legal sin rol financiero

### Principios De Acceso Para Familiares

- ser familiar no implica acceso automatico
- el acceso debe ser explicito y auditable
- los permisos deben estar scopeados por paciente y por organizacion
- una persona relacionada puede estar asociada a mas de un paciente
- una misma persona relacionada puede tener distintos permisos segun la organizacion o el paciente

### Permisos Posibles Para Futuro Portal

- `patient.summary.read`
- `patient.documents.read`
- `patient.messages.send`
- `billing.read`
- `billing.pay`
- `consents.sign`

No hace falta implementar estos permisos hoy, pero si conviene dejar clara la direccion para no modelar el familiar solo como string embebido.

## RBAC

RBAC no debe vivir en `User` como un string global.

Direccion recomendada:

- los roles base viven en `OrganizationMembership`
- el alcance por residencia vive en `FacilityAccessScope`
- los permisos efectivos se resuelven por organizacion y, cuando aplique, por residencia

Ejemplos iniciales de roles posibles:

- `org_admin`
- `org_coordinator`
- `facility_manager`
- `clinical_staff`
- `family_portal_user`
- `billing_contact`
- `read_only`

La definicion final de permisos finos queda pendiente, pero el modelo debe permitir:

- rol base organizacional
- alcance opcional por residencia
- grants explicitos para familiares o terceros

## FHIR

FHIR es un objetivo de compatibilidad, no el modelo interno obligado.

Mapeo conceptual deseado:

- `Organization` -> FHIR `Organization`
- `Facility` -> FHIR `Location`
- `Person` -> FHIR `Person`
- paciente operativo -> FHIR `Patient`
- familiar o responsable -> FHIR `RelatedPerson`
- personal -> FHIR `Practitioner`
- rol del personal por sede -> FHIR `PractitionerRole`
- estadia o tramo asistencial -> FHIR `EpisodeOfCare`
- atencion concreta -> FHIR `Encounter`

### Regla De Diseño

No diseñar la base como si todo fuese FHIR desde el primer dia.
Si diseñar el dominio de modo que un mapeo a FHIR sea natural y no exija rehacer entidades nucleares.

## Consecuencias Para La Implementacion

### Lo Que No Conviene Hacer

- poner el tenant en `User.role`
- asumir que el paciente solo existe dentro de una residencia
- modelar a los familiares solo como datos de contacto embebidos
- mezclar permisos de portal con contacto de emergencia
- atar personal a una sola residencia por defecto

### Lo Que Conviene Hacer

- introducir `Organization` como tenant
- introducir `Facility` como residencia
- mover auth y sesiones a persistencia real
- separar identidad de persona de contexto operativo
- preparar la salida de `familyContacts` desde objeto embebido hacia relaciones explicitas
- diseñar RBAC sobre memberships y grants, no sobre strings globales

## Implementacion Por Etapas

### Etapa 1

- `Organization`
- `Facility`
- `OrganizationMembership`
- sesiones con `activeOrganizationId`
- scoping por organizacion en backend

### Etapa 2

- migrar personal a modelo organizacional y multi-residencia
- agregar alcance por residencia
- introducir RBAC sobre membership

### Etapa 3

- extraer identidad de persona
- separar `PatientRecord` de `Person`
- preparar relaciones explicitas para familiares

### Etapa 4

- portal de familiares
- permisos explicitos por paciente
- pagos y responsabilidad financiera
- mapeos o contratos de interoperabilidad compatibles con FHIR

## Pendientes Aun No Cerrados

- estrategia exacta de deduplicacion de `Person`
- identificadores fuertes y politicas de merge
- modelo financiero detallado para pagos de estadia
- matriz exacta de permisos
- alcance final de FHIR en primera integracion
