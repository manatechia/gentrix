# Engineering Working Agreement

## Proposito

Este archivo define el acuerdo de trabajo tecnico para `gentrix`.
Antes de proponer arquitectura, crear nuevas features o refactorizar, revisar este documento junto con `AGENT.md`.
Si una decision de codigo entra en conflicto con este archivo, primero pedir confirmacion y luego actualizar la decision aqui.

## Estado

- Estado actual: en progreso con primeras decisiones confirmadas por el usuario.
- Fuente de verdad para contexto de negocio: `AGENT.md`.
- Fuente de verdad para criterios tecnicos y de infraestructura: este archivo.
- Pendiente: cerrar boundaries de Nx, naming, ownership tecnico y algunos detalles de evolucion.
- Implementado al 2026-03-20:
  - frontend reordenado por features dentro de `apps/frontend`
  - router activo
  - `axios` centralizado en cliente compartido
  - formularios nuevos con `Formik` + `Yup`
  - backend migrado a NestJS por modulos
  - Prisma versionado con schema, migracion base y seed

## Como Lo Vamos A Usar

1. El usuario responde este cuestionario en bloques.
2. Las respuestas se convierten en decisiones concretas en este mismo archivo.
3. Las reglas de negocio estables se resumen en `AGENT.md`.
4. Cada cambio relevante de arquitectura debe actualizar ambos archivos si afecta tecnica y negocio.

## Resumen Ejecutivo

### Norte Tecnico

- Monorepo Nx por ahora, pero con la condicion de poder separar frontend y backend rapidamente si el producto crece.
- Frontend orientado a features, con router obligatorio.
- Frontend con `axios` + servicios por ahora; posible migracion futura a TanStack Query.
- Frontend con `Formik` + `Yup` para formularios y validacion.
- Backend objetivo: `NestJS` con enfoque DDD y capas claras.
- Persistencia objetivo: PostgreSQL.
- Persistencia inicial: PostgreSQL + `Prisma`.
- Auth y permisos: simples en MVP, dejando preparado el terreno para RBAC futuro.
- Auditoria de cambios: requerida.
- Calidad minima obligatoria para merge: `typecheck` y `lint`.
- Testing inicial: minimo, priorizando unit tests para logica.

### Decisiones Confirmadas

- El producto seguira enfocado en geriatricos.
- El alcance inmediato incluye:
  - alta de pacientes
  - seguimiento de historia clinica
  - medicamentos diarios
  - alta de personal
  - gestion de datos de enfermeros y otros perfiles
  - manejo de horarios del personal
- Se mantiene Nx por ahora.
- El backend debe poder desacoplarse del frontend sin una migracion dolorosa.
- El frontend debe usar router.
- El frontend debe organizarse por features.
- Cada feature del frontend debe separar al menos `ui`, `hooks`, `services` y `schemas`.
- El frontend debe contar con `shared/ui` y `shared/lib` para piezas transversales.
- Cada feature debe tener su propio schema de validacion.
- El frontend no debe hacer `fetch` dentro de componentes.
- La logica de UI debe vivir en hooks.
- El acceso HTTP del frontend debe centralizarse en servicios con `axios`.
- Los formularios del frontend deben usar `Formik` + `Yup`.
- No se quiere depender de validacion compartida ejecutable entre frontend y backend para no acoplar repos futuros.
- El backend objetivo es `NestJS`.
- El backend debe seguir principios DDD.
- El backend debe organizarse por modulos de dominio.
- Los modulos backend deben separar `application`, `domain`, `infrastructure` y `presentation`.
- Los casos de uso deben depender de interfaces de repositorio y no de acceso directo a base de datos.
- La validacion backend debe apoyarse en DTOs + `class-validator`.
- La base de datos objetivo es PostgreSQL.
- El acceso inicial a PostgreSQL se hara con `Prisma`.
- Se usara `soft delete` como politica general.
- Se usaran IDs tecnicos UUID.
- La base debe tener migraciones desde el inicio.
- La base debe tener seeds de desarrollo desde el inicio.
- Los permisos del MVP seran simples, pero la arquitectura debe poder evolucionar a RBAC.
- Se requiere auditoria.
- La auditoria minima obligatoria sera `createdAt`, `createdBy`, `updatedAt`, `updatedBy`, `deletedAt` y `deletedBy`.
- La historia clinica se modela como timeline append-only.
- Los horarios del personal arrancan con turnos semanales y soporte para excepciones o coberturas.
- Por ahora no se pide infraestructura de logging avanzada.
- Por ahora no se exige una nota arquitectonica por cada feature.
- Norte validado para la siguiente etapa:
  - tenant real por `Organization`
  - una organizacion puede operar una o varias residencias
  - `Facility` es el nombre tecnico preferido para la residencia o geriatrico
  - el personal pertenece a la organizacion y puede operar en ninguna, una o varias residencias
  - el modelo debe dejar abierta la puerta a identidad global de paciente para evitar duplicacion futura entre organizaciones
  - los familiares no se modelaran solo como contacto embebido si van a tener acceso, permisos o pagos
  - el acceso de familiares debe resolverse con grants explicitos, no por parentesco implicito
  - FHIR es un objetivo de compatibilidad futura, no el modelo interno obligatorio

### Decisiones Pendientes

- Cuan estrictos seran los boundaries de Nx.
- Politica de boundaries de Nx y ownership tecnico.
- Reglas de nombres de archivos, modulos y paquetes.
- Estrategia concreta de deduplicacion global de personas.
- Matriz exacta de permisos y alcance por residencia.
- Modelo financiero detallado para pagos de estadia y responsables.

## Norte De Dominio 2026-03-24

- Existe una nota detallada para esta direccion en `docs/multitenancy-rbac-domain-north.md`.
- Existe una propuesta mas concreta de entidades en `docs/domain-entity-model.md`.
- Existe una propuesta concreta de primera ola Prisma en `docs/prisma-phase-1-design.md`.
- Esa nota fija el norte para multi-tenant, RBAC, pacientes, personal y acceso de familiares.
- El codigo actual todavia no refleja ese modelo; se trata de direccion confirmada antes de implementar.

## Respuestas Confirmadas 2026-03-20

### Producto Y Alcance

- Alcance a 3 meses:
  - alta de pacientes
  - seguimiento de historia clinica
  - medicamentos diarios
  - alta de personal
  - datos completos de enfermeros y otros perfiles
  - manejo de horarios
- El producto seguira siendo exclusivo para geriaticos.
- Si en el futuro se reutilizan piezas, se reutilizaran modulos ya hechos en otros sistemas, pero no se esta modelando `gentrix` como producto generico multi-rubro.

### Arquitectura General

- Se prioriza una base buena y migrable, no solo velocidad inmediata.
- Nx se mantiene por ahora.
- La separacion futura entre frontend y backend debe ser facil.

### Frontend

- Router obligatorio.
- Organizacion por features deseada.
- Tiene sentido en Nx mantener por ahora una sola app `apps/frontend` y ordenar por features dentro de esa app.
- No hace falta crear una lib Nx por feature desde el dia uno mientras exista una sola app frontend y el reuso real aun no exista.
- Si el frontend crece o aparecen multiples apps, recien ahi conviene promover features o shared a libs Nx.
- HTTP con `axios` y servicios.
- La logica debe vivir en hooks, no en componentes.
- Formularios con `Formik` + `Yup`.
- No interesa validacion ejecutable compartida entre frontend y backend.
- Cada feature debe tener su propio schema.
- Debe existir `shared/ui` y `shared/lib` para lo transversal.
- Estructura inicial confirmada:
  - `apps/frontend/src/features/<feature>/ui`
  - `apps/frontend/src/features/<feature>/hooks`
  - `apps/frontend/src/features/<feature>/services`
  - `apps/frontend/src/features/<feature>/schemas`
  - `apps/frontend/src/features/<feature>/types`
- Shared inicial confirmado:
  - `apps/frontend/src/shared/ui`
  - `apps/frontend/src/shared/lib`
  - `apps/frontend/src/shared/config`

### Backend

- Migracion objetivo a `NestJS`.
- Enfoque DDD.
- Modulos por dominio:
  - `patients`
  - `staff`
  - `medication`
  - `auth`
  - `clinical-history`
  - `schedules`
- Capas por modulo:
  - `application`
  - `domain`
  - `infrastructure`
  - `presentation`
- Los repositorios deben existir como interfaces que consumen los casos de uso y como implementaciones concretas en infraestructura.
- Validacion con DTO + `class-validator`.

### Persistencia

- PostgreSQL confirmado.
- `Prisma` confirmado como acceso inicial a PostgreSQL.
- `soft delete` como politica general.
- UUIDs como IDs tecnicos.
- Migraciones obligatorias desde el inicio.
- Seeds obligatorios desde el inicio.

### Seguridad

- En MVP no habra separacion fuerte de datos por rol.
- La arquitectura debe dejar preparado el camino hacia RBAC.
- Auditoria requerida.
- Auditoria minima confirmada: `createdAt`, `createdBy`, `updatedAt`, `updatedBy`, `deletedAt` y `deletedBy`.

### Modelado Funcional

- La historia clinica se modela como timeline de eventos append-only.
- Los eventos historicos no se modifican.
- Los horarios del personal arrancan como turnos semanales con excepciones o coberturas.

### Testing Y Calidad

- Testing inicial muy basico.
- Prioridad: unit tests para revisar logica.
- Gating de merge: `typecheck` y `lint`.
- No se requiere por ahora logging estructurado ni nota arquitectonica por cada feature.

## Cuestionario

### 1. Producto Y Alcance

1. Cual es el alcance real de `gentrix` en los proximos 3 meses?
2. Cual es el alcance real en los proximos 12 meses?
3. El sistema esta pensado solo para un geriatrico o para varios?
4. Habra multi-sede?
5. Habra multi-tenant?
6. Quienes son los usuarios principales del sistema?
7. Que roles existen hoy y cuales probablemente existan despues?
8. Que acciones son criticas para el negocio y no pueden fallar?
9. Que modulos son MVP y cuales pueden esperar?
10. Que pantallas o features queres construir primero?
11. Que tipo de crecimiento esperas: mas usuarios, mas modulos, mas integraciones o mas complejidad operativa?
12. Hay una fecha de entrega o hitos fijos?

### 2. Reglas De Negocio

1. Que significa exactamente "residente" en el dominio?
2. Que significa "staff" en el dominio?
3. Que significa "medication" en el dominio?
4. Que estado puede tener un residente y que implica cada estado?
5. Que campos son obligatorios en un alta real de residente?
6. Quien puede dar de alta, editar o archivar residentes?
7. Hay auditoria obligatoria de cambios?
8. Necesitamos historial clinico o solo operacion administrativa?
9. Que informacion es sensible o regulada?
10. Hay reglas de validacion fuertes de negocio que deban quedar en backend aunque tambien se reflejen en frontend?
11. Existen flujos de aprobacion?
12. Existen restricciones por rol para ver o editar datos?

### 3. Arquitectura General

1. Queres una arquitectura simple para iterar rapido o queres invertir antes en una base mas robusta?
2. Preferis optimizar primero velocidad de entrega o orden estructural de largo plazo?
3. Queres mantener monorepo Nx como base estable?
4. Queremos evolucionar a una arquitectura por dominios formales dentro del monorepo?
5. Queremos definir desde ahora capas explicitas como `domain`, `application`, `infrastructure`, `ui`?
6. Te interesa una aproximacion mas pragmatica al inicio y endurecer reglas despues?
7. Queres reglas estrictas de boundaries entre libs desde el principio?
8. Te preocupa mas evitar duplicacion o evitar sobreingenieria?
9. Queres ADRs tecnicos formales para decisiones grandes?
10. Queres un archivo de roadmap tecnico separado de este acuerdo?

### 4. Frontend

1. Queres mantener una sola app frontend o preves varias apps?
2. Queres introducir router ya o mantener una shell unica mientras el MVP siga chico?
3. Si crece, preferis organizar frontend por `feature`, por `domain`, por `route` o por mezcla?
4. Queres mover logica reusable a libs Nx del frontend pronto o solo cuando duela?
5. Te parece bien una convencion tipo `feature-*`, `ui-*`, `data-access-*`, `model-*`?
6. Que estrategia preferis para estado de cliente: hooks locales, context, server state o una libreria especifica?
7. Queremos incorporar una libreria de data fetching como TanStack Query o preferis fetch + hooks propios?
8. Queremos formularios con React Hook Form o preferis mantener formularios controlados a mano?
9. Queremos validacion con schema compartido en frontend y backend?
10. Queres componentes puramente presentacionales separados de hooks/containers?
11. Queres design system propio o libreria base externa?
12. Que tanto queres estandarizar accesibilidad desde ahora?
13. Queres storybook o algun catalogo de componentes?
14. Queres politicas de performance frontend desde ahora?
15. Queres internacionalizacion o solo un idioma?
16. Hay lineamientos de responsive obligatorios?
17. Queremos centralizar tokens de color, spacing, radius y tipografia en un unico lugar?
18. Queres evitar CSS fuera de Tailwind salvo casos muy puntuales?

### 5. Backend

1. Queremos seguir con Node HTTP nativo o preferis migrar temprano a Fastify/Nest/Express?
2. Que valoras mas en backend: minima dependencia, claridad, testabilidad o escalabilidad?
3. Queremos estructura por modulos de dominio ya en esta etapa?
4. Queremos separar controller, service, repository y schema validator?
5. Queres casos de uso o services explicitos para la logica de aplicacion?
6. Queremos repositorios aunque al principio sean in-memory?
7. Queremos validacion de input con Zod, Valibot, TypeBox u otra?
8. Queremos errores tipados y mapeo uniforme a HTTP?
9. Queremos logging estructurado desde ya?
10. Queremos middleware o pipeline de request aunque hoy el backend sea chico?
11. Queremos versionado de API?
12. Queremos OpenAPI o contrato documentado automaticamente?
13. Queremos paginacion, filtros y sorting estandarizados desde el inicio?
14. Queremos separar DTOs, entidades, modelos de transporte y modelos de dominio?
15. Queremos auth solo por session token simple o una base mas cercana a produccion?

### 6. Shared Contracts Y Modelado

1. Queres mantener contratos compartidos en `libs/shared/types`?
2. Preferis solo tipos TypeScript o schemas ejecutables compartidos?
3. Queremos evitar strings libres y endurecer enums/unions del dominio?
4. Queremos naming consistente para DTOs: `Input`, `Response`, `Overview`, `Detail`, `Patch`?
5. Queremos separar contratos API de modelos internos del dominio?
6. Queremos un paquete `shared/schema` aparte de `shared/types`?
7. Queremos helpers de mapping centralizados para no repetir transformaciones?
8. Queres una politica clara para ids, timestamps, audit y metadata?

### 7. Persistencia Y Datos

1. La persistencia real va a ser base de datos relacional, documental o todavia no esta decidido?
2. Si es relacional, tenes preferencia por PostgreSQL?
3. Queremos ORM, query builder o SQL directo?
4. Te importa mas control SQL o productividad de desarrollo?
5. Queremos migraciones desde el inicio?
6. Queremos seeds formales para desarrollo?
7. Queremos separar modelos de lectura y escritura si el dominio crece?
8. Queres repositorios por agregado de dominio?
9. Queres soft delete?
10. Queres trazabilidad de cambios?
11. Hay requisitos de backup o exportacion?
12. Necesitamos archivos adjuntos o documentos?

### 8. Seguridad

1. Este sistema manejara datos personales sensibles?
2. Hay exigencias regulatorias concretas que debamos contemplar?
3. Queremos RBAC formal desde el inicio?
4. Queremos permisos a nivel accion o a nivel modulo?
5. Queremos auditoria de accesos y cambios?
6. Queremos politica de expiracion y rotacion de sesiones mas real?
7. Queremos manejo formal de secretos por entorno?
8. Queremos rate limiting, CORS controlado y hardening de headers desde temprano?
9. Queremos mascar datos sensibles en logs?
10. Queremos separar ambientes y credenciales desde ya?

### 9. Testing

1. Que nivel de cobertura queres exigir?
2. Queres mas unit tests o mas integration tests?
3. Para frontend, queres tests de componentes, hooks, flows o mezcla?
4. Para backend, queres tests de endpoints, services y repositorios?
5. Queremos testear contratos compartidos?
6. Queremos tests e2e para flows criticos?
7. Que flujos son obligatorios en CI?
8. Queres test factories y builders formales para evitar fixtures repetidos?
9. Queremos snapshots o preferis evitarlos?
10. Queres una piramide de testing explicita documentada?

### 10. Calidad Y Mantenibilidad

1. Queres ESLint y Prettier con reglas estrictas ahora?
2. Queres chequeos de imports ciclicos y boundaries de Nx?
3. Queres convenciones obligatorias para nombres de archivos y carpetas?
4. Queres limite de tamano para archivos, componentes o funciones?
5. Queres checklist de PR obligatoria?
6. Queres definiciones de "done" por feature?
7. Queres prohibir logica de negocio dentro de componentes React?
8. Queres prohibir acceso directo a fetch fuera de data-access?
9. Queres una politica explicita para refactors?
10. Queres estandarizar comentarios, docs y decision logs?

### 11. Observabilidad Y Operacion

1. Queremos logging estructurado localmente y en produccion?
2. Queremos request ids o correlation ids?
3. Queremos metricas de negocio y metricas tecnicas?
4. Queremos tracing distribuido o todavia es demasiado pronto?
5. Queremos healthchecks mas ricos?
6. Queremos monitoreo de errores desde el inicio?
7. Queremos definir politicas de retry, timeout y fallback?

### 12. CI/CD Y Entornos

1. Donde se va a deployar el frontend?
2. Donde se va a deployar el backend?
3. Cuantos ambientes queres tener: local, dev, staging, prod?
4. Queremos pipelines diferentes por app?
5. Queremos preview environments?
6. Queremos bloquear merge si fallan build, tests o lint?
7. Queremos versionado semantico?
8. Queremos changelog?
9. Queremos automatizar releases o no todavia?

### 13. Developer Experience

1. Queres generadores/scaffolds para features repetitivas?
2. Queres plantillas de modulo frontend y backend?
3. Queres comandos unificados para correr subsets del monorepo?
4. Queres convenciones de ramas?
5. Queres convenciones de commits?
6. Queres que documentemos recipes comunes de desarrollo?
7. Queres que cada nueva feature venga con una mini nota arquitectonica?

### 14. Convenciones Que Puedo Respetar Desde Ahora

Responder idealmente con "si", "no" o una breve regla:

1. Frontend por features y subcapas (`feature`, `ui`, `data-access`, `model`).
2. Backend por dominios y capas (`routes`, `application`, `domain`, `infrastructure`).
3. Nada de strings sueltos si puede ser union type o schema.
4. Nada de fetch directo en componentes.
5. Nada de logica de negocio importante en handlers HTTP.
6. Todo input externo validado con schema.
7. Todo caso de uso importante cubierto por tests.
8. Todo endpoint nuevo con contrato compartido.
9. Todo modulo nuevo con `README` corto o nota de intencion.
10. Toda decision grande reflejada en este archivo.

## Decisiones Operativas

### Frontend

- Usar router desde la proxima iteracion estructural del frontend.
- Organizar el frontend por features.
- Estructura inicial acordada en Nx:
  - `apps/frontend/src/features/<feature>/ui`
  - `apps/frontend/src/features/<feature>/hooks`
  - `apps/frontend/src/features/<feature>/services`
  - `apps/frontend/src/features/<feature>/schemas`
  - `apps/frontend/src/features/<feature>/types`
- Estructura shared acordada:
  - `apps/frontend/src/shared/ui`
  - `apps/frontend/src/shared/lib`
  - `apps/frontend/src/shared/config`
- Centralizar acceso HTTP en servicios con `axios`.
- Centralizar configuracion HTTP en un cliente `axios` unico con interceptores.
- Mantener la logica de UI fuera de componentes visuales y llevarla a hooks.
- Usar `Formik` + `Yup` en formularios nuevos o refactorizados.
- Evitar dependencias de runtime compartidas con backend que hagan dificil separar repos.

### Backend

- La direccion objetivo del backend es `NestJS`.
- El backend debe evolucionar a una arquitectura DDD con capas claras.
- La logica de negocio no debe quedar pegada a handlers HTTP.
- Mantener el diseño listo para una futura separacion fisica del backend respecto del frontend.
- Incorporar auditoria en entidades y casos de uso donde aplique.
- Estructura inicial acordada en NestJS:
  - `src/modules/patients`
  - `src/modules/staff`
  - `src/modules/medication`
  - `src/modules/auth`
  - `src/modules/clinical-history`
  - `src/modules/schedules`
- Estructura por modulo acordada:
  - `application/use-cases`
  - `domain/entities`
  - `domain/value-objects`
  - `domain/repositories`
  - `infrastructure/persistence`
  - `presentation/controllers`
  - `presentation/dto`
- Los casos de uso deben depender de interfaces de repositorio.
- Las implementaciones concretas de PostgreSQL deben vivir en `infrastructure`.
- `Prisma` es la tecnologia inicial de persistencia.

### Shared

- Compartir contratos cuando sirva al monorepo actual, pero sin asumir que frontend y backend quedaran acoplados para siempre.
- Evitar que la estrategia de shared del monorepo impida una futura separacion de repositorios.

### Testing

- Empezar con unit tests sobre logica relevante.
- No sobredimensionar testing en esta etapa.
- Dejar la puerta abierta para endurecer la estrategia cuando el producto madure.

### CI/CD

- Bloquear merge al menos por `typecheck` y `lint`.

### Seguridad

- Mantener permisos simples en MVP.
- Diseñar para evolucionar a RBAC.
- Considerar auditoria como requerimiento estable.
- Auditoria minima obligatoria: `createdAt`, `createdBy`, `updatedAt`, `updatedBy`, `deletedAt` y `deletedBy`.

## Proximo Paso

Cerrar estas decisiones antes de la siguiente ronda fuerte de codigo:

1. Definir si activaremos boundaries estrictos de Nx cuando empecemos a extraer libs.
2. Definir reglas de naming para archivos, modulos y casos de uso.
3. Definir ownership tecnico por feature o modulo.
4. Detallar el modelo de horarios cuando el dominio madure.

## Pendiente Tecnico Abierto

### Boundaries De Nx

- Significado:
  - reglas para impedir imports entre modulos o libs que no deberian depender entre si
- Recomendacion:
  - no endurecer esto demasiado mientras el frontend siga dentro de una sola app
  - activarlo cuando empecemos a extraer libs por feature o shared
