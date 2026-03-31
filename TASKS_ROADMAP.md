# Technical Roadmap

Last updated: 2026-03-30
Source of truth: este archivo
Status conventions:
- pending
- in_progress
- done

Commit convention:
- formato sugerido: `RES-03 unify resident timeline model`
- formato alternativo para cambios grandes: `RES-14 publish resident current-state read model`
- si un commit toca varias tareas, registrar la principal en el commit y las demas en `Notas`

Workflow rules:
- no arrancar una tarea si sus `Bloquea` siguen abiertos, salvo decision explicita en `Notas`
- cuando una tarea toque coexistencia con legado, dejarlo reflejado en `Migracion` y `Notas`
- actualizar `Estado`, `Commit/PR` y `Notas` en el mismo cambio que avance la tarea
- revisar `Legacy touchpoints` antes de tocar schema, contratos, endpoints o UI principal

## Operative snapshot

### In progress
- none

### Blocked
- none

### Next up
- RES-05
- RES-01
- RES-03

## Nucleo de dominio del residente

### RES-01. Introducir Person, PatientRecord y FacilityStay como nucleo evolutivo del dominio de residentes
- Estado: pending
- Owner: shared
- Impacto: migration
- Descripcion: Separar identidad global, ficha asistencial y estadia operativa del residente.
- Bloquea: -
- Relacionado con: RES-02, RES-04, RES-08, RES-09, RES-10
- Legacy touchpoints: schema.prisma, shared-types, domain-residents, prisma resident repository
- Migracion: coexistencia temporal con modelo legacy
- Commit/PR: -
- Criterio de cierre: schema creado + repositorios activos + endpoint principal de lectura resolviendo desde PatientRecord y FacilityStay + tests minimos verdes
- Notas:

### RES-02. Crear el historial de estadias con admision, traslado, cambio de habitacion/cama, egreso y fallecimiento sin sobrescritura del residente
- Estado: pending
- Owner: shared
- Impacto: migration
- Descripcion: Registrar cambios de permanencia y ocupacion como historial auditable en lugar de sobrescribir estado.
- Bloquea: RES-01
- Relacionado con: RES-08, RES-14, RES-18, RES-19
- Legacy touchpoints: schema.prisma, residents service, resident detail query, admissions panel
- Migracion: coexistencia temporal con modelo legacy
- Commit/PR: -
- Criterio de cierre: admision, traslado, cambio de habitacion/cama, egreso y fallecimiento crean registros historicos + los flujos nuevos no escriben ocupacion sobre el agregado base + tests minimos verdes
- Notas:

### RES-03. Unificar ResidentEvent y ClinicalHistoryEvent en un unico timeline clinico-operativo append-only y tipado
- Estado: pending
- Owner: shared
- Impacto: migration
- Descripcion: Consolidar eventos clinicos y operativos en un solo modelo de timeline con contratos consistentes.
- Bloquea: RES-01
- Relacionado con: RES-07, RES-11, RES-13, RES-14, RES-15
- Legacy touchpoints: shared-types, clinical-history module, residents controller, clinical-history panel
- Migracion: coexistencia temporal con modelo legacy
- Commit/PR: -
- Criterio de cierre: un solo modelo tipado + un solo endpoint de timeline en uso + frontend detail creando y leyendo solo ese timeline + tests minimos verdes
- Notas:

### RES-04. Separar en persistencia y contratos los datos identitarios, la ficha asistencial, el estado actual y los snapshots transicionales del residente
- Estado: pending
- Owner: shared
- Impacto: migration
- Descripcion: Ordenar el agregado del residente segun ciclos de vida y responsabilidades distintas.
- Bloquea: RES-01
- Relacionado con: RES-07, RES-11, RES-12
- Legacy touchpoints: shared-types, domain-residents, schema.prisma, resident-form-adapter
- Migracion: coexistencia temporal con modelo legacy
- Commit/PR: -
- Criterio de cierre: contratos segmentados + mapeos de persistencia separados + sin writes nuevos mezclando identidad, estado actual y snapshots en una sola estructura mutable
- Notas:

## Aislamiento, permisos y consistencia

### RES-05. Endurecer el scoping por organizationId y facilityId en endpoints, servicios y repositorios de residentes e historia clinica
- Estado: pending
- Owner: coco
- Impacto: breaking
- Descripcion: Aplicar aislamiento organizacional y operativo real a todas las lecturas y escrituras del residente.
- Bloquea: -
- Relacionado con: RES-06, RES-15, RES-16
- Legacy touchpoints: session guard, residents controller, clinical-history controller, prisma repositories
- Migracion: cutover directo
- Commit/PR: -
- Criterio de cierre: todas las lecturas y mutaciones del residente y timeline filtran por organizationId y facilityId activos + tests de acceso cruzado rechazados correctamente
- Notas:

### RES-06. Mover la visibilidad de datos administrativos del residente al backend con proyecciones por rol
- Estado: pending
- Owner: shared
- Impacto: breaking
- Descripcion: Dejar de depender del frontend para ocultar datos sensibles del residente.
- Bloquea: RES-05
- Relacionado con: RES-07, RES-14
- Legacy touchpoints: role-access, residents controller, resident detail workspace, authz helpers
- Migracion: cutover directo
- Commit/PR: -
- Criterio de cierre: backend expone al menos una proyeccion de gestion y una de personal + la UI principal consume solo la proyeccion permitida + no queda ocultamiento critico solo en frontend
- Notas:

### RES-07. Alinear frontend, DTOs, servicios y contratos compartidos con el nuevo nucleo de paciente y eliminar endpoints duplicados de historia clinica/eventos
- Estado: pending
- Owner: shared
- Impacto: breaking
- Descripcion: Eliminar divergencias entre capas y consolidar contratos y flujos del residente.
- Bloquea: RES-01, RES-03, RES-04
- Relacionado con: RES-06, RES-12, RES-14
- Legacy touchpoints: shared-types, DTOs, residents service, frontend residents service, resident routes
- Migracion: coexistencia temporal con modelo legacy
- Commit/PR: -
- Criterio de cierre: frontend, backend y shared-types usan el mismo contrato principal + no quedan endpoints duplicados para timeline + tests minimos verdes
- Notas:

## Ubicacion, relaciones y datos satelite

### RES-08. Reemplazar la ocupacion actual basada en room y address.room por una entidad de ubicacion operativa unica
- Estado: pending
- Owner: shared
- Impacto: migration
- Descripcion: Modelar la ubicacion del residente sin duplicar habitacion entre estado actual y domicilio.
- Bloquea: RES-01, RES-02
- Relacionado con: RES-14, RES-19
- Legacy touchpoints: schema.prisma, domain-residents, resident detail query, admissions panel
- Migracion: coexistencia temporal con modelo legacy
- Commit/PR: -
- Criterio de cierre: existe una sola fuente de verdad para ubicacion operativa + detail y formulario principal la usan + room y address.room dejan de recibir escrituras nuevas
- Notas:

### RES-09. Extraer familyContacts y emergencyContact a relaciones explicitas de personas vinculadas y contactos operativos
- Estado: pending
- Owner: shared
- Impacto: migration
- Descripcion: Separar vinculos personales y contacto operativo de los datos embebidos del residente.
- Bloquea: RES-01
- Relacionado con: RES-10, RES-12, RES-19
- Legacy touchpoints: schema.prisma, shared-types, admissions panel, resident detail workspace
- Migracion: coexistencia temporal con modelo legacy
- Commit/PR: -
- Criterio de cierre: personas vinculadas y contacto operativo persistidos en relaciones propias + alta y detalle usando esas relaciones + sin nuevas escrituras a familyContacts o emergencyContact legacy
- Notas:

### RES-10. Modelar cobertura, responsable financiero y autorizaciones del residente fuera de los JSON embebidos
- Estado: pending
- Owner: shared
- Impacto: migration
- Descripcion: Pasar cobertura y responsabilidades a entidades con relaciones y trazabilidad propia.
- Bloquea: RES-01
- Relacionado con: RES-09, RES-12, RES-19
- Legacy touchpoints: schema.prisma, shared-types, admissions panel, resident detail workspace
- Migracion: coexistencia temporal con modelo legacy
- Commit/PR: -
- Criterio de cierre: cobertura, responsable financiero y grants persistidos fuera del agregado principal + formularios y endpoints principales sin escrituras nuevas a JSON legacy
- Notas:

### RES-11. Convertir los adjuntos clinicos embebidos en dataUrl a entidades de documento referenciadas por paciente y evento
- Estado: pending
- Owner: shared
- Impacto: migration
- Descripcion: Separar documentos del agregado principal y vincularlos al residente y a sus eventos.
- Bloquea: RES-03, RES-04
- Relacionado con: RES-12, RES-19
- Legacy touchpoints: schema.prisma, resident repository, admissions panel, resident detail workspace
- Migracion: coexistencia temporal con modelo legacy
- Commit/PR: -
- Criterio de cierre: modelo de documento persistido + flujo principal de alta o timeline usando referencias + sin nuevas escrituras de dataUrl sobre el residente
- Notas:

### RES-12. Cerrar el gap entre alta y edicion del residente con flujos de mantenimiento para cobertura, familiares, pertenencias, adjuntos y perfil clinico
- Estado: pending
- Owner: naza
- Impacto: additive
- Descripcion: Habilitar actualizacion real de datos que hoy solo se capturan al alta.
- Bloquea: -
- Relacionado con: RES-07, RES-09, RES-10, RES-11
- Legacy touchpoints: resident-edit-workspace, admissions panel, resident-form-adapter, residents service
- Migracion: sin migracion
- Commit/PR: -
- Criterio de cierre: existen flujos de mantenimiento activos para cobertura, personas vinculadas, pertenencias, adjuntos y perfil clinico + editar residente deja de depender solo del formulario de alta
- Notas:

## Timeline clinico-operativo y estado actual

### RES-13. Estructurar diagnosticos, antecedentes, cirugias, internaciones e incidentes dentro del nuevo timeline clinico-operativo
- Estado: pending
- Owner: shared
- Impacto: migration
- Descripcion: Reemplazar texto libre disperso por eventos clinicos tipados y trazables.
- Bloquea: RES-03
- Relacionado con: RES-14, RES-19
- Legacy touchpoints: clinical-history module, clinical-history panel, shared-types, prisma seed
- Migracion: coexistencia temporal con modelo legacy
- Commit/PR: -
- Criterio de cierre: diagnostico, antecedente, cirugia, internacion e incidente existen como tipos cerrados + UI principal puede crearlos y leerlos + tests minimos verdes
- Notas:

### RES-14. Publicar un read model de estado actual del residente para detalle, dashboard y handoff
- Estado: pending
- Owner: shared
- Impacto: additive
- Descripcion: Exponer una proyeccion consistente del estado presente del residente para operacion diaria.
- Bloquea: RES-02, RES-03, RES-08, RES-13
- Relacionado con: RES-06, RES-18, RES-20
- Legacy touchpoints: resident-live-profile query, dashboard service, handoff snapshot, resident detail route
- Migracion: coexistencia temporal con modelo legacy
- Commit/PR: -
- Criterio de cierre: endpoint de current state publicado + detail, dashboard y handoff consumen solo ese read model + sin lecturas criticas desde estructura legacy
- Notas:

### RES-15. Vincular eventos clinicos, prescripciones y administraciones con StaffRecord y memberships en lugar de actores string
- Estado: pending
- Owner: coco
- Impacto: migration
- Descripcion: Reemplazar referencias textuales a actores por relaciones explicitas con personal y contexto organizacional.
- Bloquea: RES-03, RES-05
- Relacionado con: RES-16, RES-17
- Legacy touchpoints: medication module, clinical-history module, staff module, shared-types
- Migracion: coexistencia temporal con modelo legacy
- Commit/PR: -
- Criterio de cierre: timeline, ordenes y ejecuciones guardan staffRecordId o membershipId + no se crean nuevos actores string + tests minimos verdes
- Notas:

## Medicacion y operacion diaria

### RES-16. Inmovilizar la identidad clinica de MedicationOrder y evitar reasignar residente o medicamento sobre ordenes existentes
- Estado: pending
- Owner: coco
- Impacto: breaking
- Descripcion: Impedir que una orden de medicacion cambie de residente o farmaco una vez creada.
- Bloquea: RES-05
- Relacionado con: RES-15, RES-17
- Legacy touchpoints: medication service, medication intake panel, medication repository, schema.prisma
- Migracion: cutover directo
- Commit/PR: -
- Criterio de cierre: update de MedicationOrder no acepta residentId ni medicationCatalogId + la UI no permite reasignarlos + tests de integridad verdes
- Notas:

### RES-17. Identificar cada MedicationExecution contra una dosis programada concreta y eliminar el matching heuristico por ventana horaria
- Estado: pending
- Owner: coco
- Impacto: migration
- Descripcion: Hacer trazable cada ejecucion de medicacion respecto de la dosis esperada.
- Bloquea: RES-16
- Relacionado con: RES-14, RES-18, RES-20
- Legacy touchpoints: medication executions, handoff snapshot, dashboard alerts, shared-types
- Migracion: coexistencia temporal con modelo legacy
- Commit/PR: -
- Criterio de cierre: cada MedicationExecution refiere a una dosis programada concreta + handoff y dashboard no usan matching por ventana horaria + tests minimos verdes
- Notas:

### RES-18. Rehacer dashboard y handoff sobre el nuevo timeline y las nuevas proyecciones de estado del residente
- Estado: pending
- Owner: naza
- Impacto: breaking
- Descripcion: Recalcular alertas y handoff a partir del nuevo modelo operativo del residente.
- Bloquea: RES-14, RES-17
- Relacionado con: RES-20
- Legacy touchpoints: dashboard workspace, handoff workspace, system service, handoff snapshot
- Migracion: cutover directo
- Commit/PR: -
- Criterio de cierre: dashboard y handoff usan solo el read model nuevo y el timeline nuevo + no quedan lecturas operativas desde logica legacy
- Notas:

## Datos de soporte y calidad

### RES-19. Reescribir seeds, mocks y fixtures para representar residentes, estadias, relaciones y timeline de forma consistente
- Estado: pending
- Owner: shared
- Impacto: migration
- Descripcion: Alinear datos de desarrollo y pruebas con el modelo real que se implemente.
- Bloquea: -
- Relacionado con: RES-01, RES-02, RES-03, RES-09, RES-10, RES-20
- Legacy touchpoints: prisma seed, in-memory-seed, domain seeds, frontend-e2e fixtures
- Migracion: sin migracion
- Commit/PR: -
- Criterio de cierre: seed principal, mocks y fixtures E2E generan solo estructuras vigentes del roadmap + CI local verde con esos datos
- Notas:

### RES-20. Extender pruebas de integracion y E2E para admision, cambios de ocupacion, seguimiento clinico, medicacion, egreso y fallecimiento
- Estado: pending
- Owner: naza
- Impacto: additive
- Descripcion: Cubrir con pruebas los flujos operativos clave del ciclo de vida del residente.
- Bloquea: -
- Relacionado con: RES-14, RES-17, RES-18, RES-19
- Legacy touchpoints: residents.spec.ts, medication.spec.ts, backend specs, playwright helpers
- Migracion: sin migracion
- Commit/PR: -
- Criterio de cierre: suites de integracion y E2E cubren admision, traslado, egreso, timeline y medicacion + tests pasan verdes sin fixtures manuales
- Notas:

## Open decisions
- Definir si `FacilityStay` va a ser una entidad persistente propia o una proyeccion derivada con escritura indirecta.
- Definir si el timeline clinico-operativo nuevo reemplaza por completo los modelos legacy o convive una etapa con criterios de cutover explicitos.
- Definir si el estado actual del residente se deriva siempre desde estadias y timeline o si existe una proyeccion materializada mutable.
- Definir si cama entra como entidad de primer nivel en esta ola o si se limita a habitacion con campo adicional.
- Definir como se resuelve la transicion de adjuntos clinicos desde `dataUrl` embebido hacia almacenamiento y referencias persistentes.
- Definir como versionar permisos y proyecciones por rol durante la coexistencia entre detalle legacy y read models nuevos.
- Definir la estrategia de deduplicacion de `Person` cuando una misma persona aparezca en varias organizaciones.

## Maintenance rules
- Cada commit relevante debe referenciar el ID principal de una tarea.
- Cuando una tarea empieza, pasa a `in_progress`.
- Cuando una tarea cumple su criterio de cierre, pasa a `done`.
- Si una tarea queda trabada, debe figurar en `Blocked`.
- `Notas` debe registrar avances concretos, decisiones o riesgos, no comentarios genericos.
- No eliminar tareas; solo actualizar estado, notas y referencias.
