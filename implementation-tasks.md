# Tareas de implementacion

## Reglas de uso

- Cada tarea debe poder convertirse en ticket.
- Cada tarea debe acercar el sistema a la vision centrada en el residente.
- Priorizar decisiones de dominio antes que pantallas vistosas.
- No agregar features que dependan de una base no definida.
- Estimacion: `S` pequena, `M` mediana, `L` grande.
- Estado por defecto: `pendiente` si la tarea no indica otro estado.

## Fase 1

### TASK-000 - Definir invariantes del dominio del residente

- Estado: `realizada`
- Tipo: decision / dominio / arquitectura
- Prioridad: alta
- Estimacion: S
- Objetivo: fijar las reglas que no deben romperse al evolucionar `Resident`, su perfil, su estado actual y sus eventos.
- Que problema evita: introducir features clinicas sin reglas base y seguir expandiendo `Resident` como contenedor de cualquier cosa.
- Que tocaria: `libs/shared/types/src/lib/shared-types.ts`, `libs/domain/residents/src/lib/domain-residents.ts`, `apps/backend/src/modules/residents/application/residents.service.ts`, `docs/implementation-tasks.md` si hace falta cerrar definiciones en el mismo backlog operativo.
- Dependencias: ninguna.
- Definition of Done: quedan definidas y escritas las invariantes minimas del residente, incluyendo que es dato estable, que es estado actual, que es evento y que es dato derivado; el resultado incluye un cuadro minimo reusable por el equipo con ejemplos concretos como `fullName` o `birthDate` como dato estable, `room` y `medicacion activa` como estado actual, `medicacion administrada` y `follow-up` como evento, y `alerta derivada` como dato derivado; queda explicitado que ninguno de esos grupos vuelve a mezclarse en un mismo contrato de escritura.
- Notas:
  - Dato estable: `firstName`, `lastName`, `birthDate`, `documentNumber`.
  - Estado actual: `room`, `status`, `careLevel`, ordenes activas de `MedicationOrder`.
  - Evento: `ClinicalHistoryEvent`, futura ejecucion de medicacion, observacion de seguimiento.
  - Dato derivado: alertas, proximas tomas, resumen de handoff.

### TASK-001 - Separar el contrato del residente entre datos estables y cambios temporales

- Estado: `realizada`
- Tipo: refactor / dominio / backend
- Prioridad: alta
- Estimacion: M
- Objetivo: dejar de usar `ResidentUpdateInput extends ResidentCreateInput` como contrato unico para toda la vida del residente.
- Que problema evita: que `Resident` siga creciendo como snapshot/formulario y absorba eventos operativos.
- Que tocaria: `libs/shared/types/src/lib/shared-types.ts`, `libs/domain/residents/src/lib/domain-residents.ts`, `apps/backend/src/modules/residents/presentation/dto/create-resident.dto.ts`, `apps/backend/src/modules/residents/presentation/dto/update-resident.dto.ts`, `apps/backend/src/modules/residents/application/residents.service.ts`.
- Dependencias: TASK-000.
- Definition of Done: existe un contrato explicito para datos base del residente y la actualizacion de residente ya no obliga a enviar antecedentes, adjuntos y otros datos temporales como snapshot completo.

### TASK-002 - Preservar identidad de antecedentes, adjuntos y contactos al editar residente

- Estado: `realizada`
- Tipo: refactor / dominio / backend / frontend
- Prioridad: alta
- Estimacion: M
- Objetivo: garantizar que editar datos estables del residente no regenere colecciones hijas ni altere relaciones o historial no tocados.
- Que problema evita: perdida de trazabilidad y diffs falsos en `medicalHistory`, `familyContacts` y `attachments`, y actualizaciones accidentales sobre medicacion o eventos relacionados.
- Que tocaria: `libs/domain/residents/src/lib/domain-residents.ts`, `apps/backend/src/modules/residents/infrastructure/persistence/prisma/prisma-resident.repository.ts`, `apps/frontend/src/features/residents/lib/resident-form-adapter.ts`, `apps/frontend/src/features/residents/types/resident-form-values.ts`.
- Dependencias: TASK-001.
- Definition of Done: editar un dato base del residente no recrea antecedentes, adjuntos ni contactos existentes; los ids de items ya guardados se preservan; la actualizacion no rompe relaciones existentes ni pisa historial; la operacion no altera por accidente medicacion asociada ni eventos del residente; existen verificaciones automatizadas o tests de integracion que cubren al menos cambio de `room` o `email` sin regenerar colecciones hijas.

### TASK-003 - ADR - Definir el modelo minimo de eventos del residente sobre la base existente

- Estado: `realizada`
- Tipo: ADR / dominio / arquitectura
- Prioridad: alta
- Estimacion: S
- Objetivo: fijar si el proyecto sigue sobre `ClinicalHistoryEvent` o introduce un alias/contrato superior para eventos del residente.
- Que problema evita: abrir incidentes, observaciones y handoff sobre modelos distintos o incompatibles.
- Que tocaria: `apps/backend/prisma/schema.prisma`, `libs/shared/types/src/lib/shared-types.ts`, `apps/backend/src/modules/residents/infrastructure/persistence/prisma/prisma-resident.repository.ts`, `docs/implementation-tasks.md` o un ADR corto en `docs/` si se decide separarlo.
- Dependencias: TASK-000.
- Outcome esperado: queda decidido el nombre estable del concepto, el set inicial de tipos de evento y el payload minimo comun.
- Plazo: corto; resolver en 1 a 2 dias de trabajo y cerrarlo antes de tocar API.
- Definition of Done: el equipo puede implementar endpoints de eventos sin ambiguedad de nombre, tipo ni forma de persistencia.

### TASK-004 - Exponer API minima de eventos del residente

- Estado: `realizada`
- Tipo: feature / backend
- Prioridad: alta
- Estimacion: M
- Objetivo: permitir listar y crear eventos del residente sin pasar por el formulario completo de admision/edicion.
- Que problema evita: seguir usando `medicalHistory` como unico contenedor temporal.
- Que tocaria: `apps/backend/src/modules/residents/presentation/controllers/residents.controller.ts`, `apps/backend/src/modules/residents/application/residents.service.ts`, `apps/backend/src/modules/residents/infrastructure/persistence/prisma/prisma-resident.repository.ts`, `libs/shared/types/src/lib/shared-types.ts`.
- Dependencias: TASK-001, TASK-003.
- Definition of Done: existe un endpoint para listar eventos del residente ordenados por `occurredAt` y otro para crear al menos un evento simple; los eventos seed `admission-note` y `follow-up` quedan visibles desde API.

## Fase 2

### TASK-005A - Construir read model backend para ficha viva minima

- Estado: `realizada`
- Tipo: feature / backend
- Prioridad: alta
- Estimacion: M
- Objetivo: agregar una lectura agregada del residente con datos base, medicacion activa y eventos recientes, tomando explicitamente una de estas dos opciones de implementacion: exponerla desde `ResidentsService` o crear un query service/agregador dedicado.
- Que problema evita: obligar al frontend a armar la ficha viva a partir de multiples llamadas sin contrato estable.
- Que tocaria: `apps/backend/src/modules/residents/application/residents.service.ts`, `apps/backend/src/modules/medication/application/medication.service.ts`, `apps/backend/src/modules/residents/presentation/controllers/residents.controller.ts`, `libs/shared/types/src/lib/shared-types.ts`.
- Dependencias: TASK-004.
- Definition of Done: existe un payload de lectura para la ficha viva minima que devuelve datos base del residente, medicacion activa y eventos recientes en una sola respuesta; queda explicitado en codigo y/o tipos si esa lectura vive en `ResidentsService` o en un query service/agregador dedicado; no queda ambiguedad abierta para la implementacion frontend.

### TASK-005B - Implementar UI de ficha viva minima del residente

- Estado: `realizada`
- Tipo: feature / frontend
- Prioridad: alta
- Estimacion: M
- Objetivo: mostrar en el detalle del residente la informacion agregada por el read model de ficha viva.
- Que problema evita: que la ficha siga siendo solo un archivo estatico y que el dashboard global concentre toda la operacion.
- Que tocaria: `apps/frontend/src/features/residents/ui/resident-detail-workspace.tsx`, `apps/frontend/src/features/residents/hooks/use-resident-detail-route.ts`, `apps/frontend/src/features/residents/services/residents-service.ts`, `libs/shared/types/src/lib/shared-types.ts`.
- Dependencias: TASK-005A.
- Definition of Done: al abrir un residente se ve la ficha actual con un bloque de medicacion activa y un bloque de eventos recientes cargados desde el nuevo payload agregado.

### TASK-006 - ADR - Endurecer el modelo de `MedicationOrder` como prescripcion vigente

- Estado: `realizada`
- Tipo: ADR / dominio / arquitectura
- Prioridad: alta
- Estimacion: S
- Objetivo: dejar explicito que `MedicationOrder` representa la orden vigente y no la ejecucion diaria.
- Que problema evita: mezclar administracion, omision o rechazo dentro de la misma entidad de orden.
- Que tocaria: `libs/shared/types/src/lib/shared-types.ts`, `libs/domain/medication/src/lib/domain-medication.ts`, `apps/backend/src/modules/medication/application/medication.service.ts`, `apps/frontend/src/features/medication/ui/medication-intake-panel.tsx`.
- Dependencias: TASK-000.
- Outcome esperado: queda decidido si la ejecucion de medicacion vive en una entidad propia o como especializacion del modelo de eventos, sin contaminar `MedicationOrder`.
- Plazo: corto; resolver en 1 a 2 dias de trabajo antes de abrir migraciones nuevas.
- Definition of Done: el contrato de `MedicationOrder` queda documentado en tipos y servicio como prescripcion vigente; el camino para modelar ejecucion queda explicitado.

### TASK-007 - Crear modelo y persistencia para ejecucion de medicacion

- Estado: `realizada`
- Tipo: feature / dominio / backend
- Prioridad: alta
- Estimacion: L
- Objetivo: registrar administracion, omision o rechazo de una orden de medicacion con fecha, actor y resultado.
- Que problema evita: que medicacion quede como agenda declarativa sin evidencia de cuidado real.
- Que tocaria: `apps/backend/prisma/schema.prisma`, nuevas migraciones en `apps/backend/prisma/migrations`, `libs/shared/types/src/lib/shared-types.ts`, `apps/backend/src/modules/medication/...`, y `apps/backend/src/modules/residents/...` si se integra al timeline.
- Dependencias: TASK-003, TASK-006.
- Definition of Done: existe persistencia para ejecuciones de medicacion, con endpoints/backend para crear y consultar ejecuciones por orden o por residente.

### TASK-008 - Registrar ejecucion de medicacion desde UI operativa

- Estado: `realizada`
- Tipo: feature / frontend
- Prioridad: media
- Estimacion: M
- Objetivo: habilitar una accion simple para marcar una toma como administrada, omitida o rechazada.
- Que problema evita: depender de la edicion de la orden para registrar lo que realmente ocurrio.
- Que tocaria: `apps/frontend/src/features/medication/ui/medication-orders-panel.tsx`, `apps/frontend/src/features/medication/hooks/use-medications-route.ts`, `apps/frontend/src/features/medication/services/medications-service.ts`, y/o `apps/frontend/src/features/residents/ui/resident-detail-workspace.tsx`.
- Dependencias: TASK-007, TASK-005B.
- Definition of Done: desde la UI se puede registrar una ejecucion minima de medicacion y el resultado impacta en el residente y/o en la vista de medicacion sin editar la orden base.

## Fase 3

### TASK-009A - Reemplazar `dashboardAlerts` por alertas derivadas minimas tempranas

- Tipo: feature / backend / frontend
- Prioridad: media
- Estimacion: M
- Objetivo: generar alertas basicas desde datos reales del sistema en lugar de usar strings fijas, usando solo perfil vivo, medicacion activa y eventos recientes.
- Que problema evita: dar una falsa sensacion de soporte operativo maduro.
- Que tocaria: `apps/backend/src/modules/system/application/system.service.ts`, `apps/backend/src/common/persistence/in-memory-seed.ts`, `apps/frontend/src/features/alerts/ui/alerts-panel.tsx`, y si conviene `apps/frontend/src/features/residents/ui/resident-detail-workspace.tsx`.
- Dependencias: TASK-005A, TASK-005B.
- Definition of Done: el dashboard deja de leer `dashboardAlerts` hardcodeadas y muestra al menos alertas derivadas de medicacion activa, nivel de cuidado y/o eventos recientes, sin depender todavia de la ejecucion de medicacion.

### TASK-009B - Enriquecer alertas derivadas con ejecucion real de medicacion

- Tipo: feature / backend / frontend
- Prioridad: media
- Estimacion: M
- Objetivo: ampliar las alertas para incluir omisiones, rechazos o ejecuciones pendientes de medicacion.
- Que problema evita: que las alertas operativas ignoren el estado real de administracion una vez exista esa capacidad.
- Que tocaria: `apps/backend/src/modules/system/application/system.service.ts`, `apps/backend/src/modules/medication/...`, `apps/frontend/src/features/alerts/ui/alerts-panel.tsx`, y si conviene `apps/frontend/src/features/residents/ui/resident-detail-workspace.tsx`.
- Dependencias: TASK-007, TASK-008, TASK-009A.
- Definition of Done: las alertas incluyen al menos una senal basada en ejecucion real de medicacion, como omision o rechazo reciente, y conviven con las alertas tempranas ya implementadas.

### TASK-010 - Construir vista minima de handoff por turno

- Tipo: feature / producto / backend / frontend
- Prioridad: media
- Estimacion: M
- Objetivo: resumir que paso y que queda pendiente para el siguiente turno usando datos reales.
- Que problema evita: agregar "pase de turno" como pantalla vacia o copy sin base temporal.
- Que tocaria: nueva vista en `apps/frontend/src/app/router.tsx` y `apps/frontend/src/features/...`, `apps/backend/src/modules/system/...` o un modulo nuevo chico de handoff, `libs/shared/types/src/lib/shared-types.ts`.
- Dependencias: TASK-004, TASK-007, TASK-008, TASK-009B.
- Definition of Done: existe una vista minima con residentes relevantes, eventos recientes y medicaciones omitidas/pendientes del turno, construida desde datos reales.

## Orden recomendado de ejecucion

1. TASK-000
2. TASK-001
3. TASK-002
4. TASK-003
5. TASK-004
6. TASK-005A
7. TASK-005B
8. TASK-009A
9. TASK-006
10. TASK-007
11. TASK-008
12. TASK-009B
13. TASK-010

## Bloqueos / decisiones previas

- Cerrar TASK-003 antes de exponer cualquier API nueva de eventos del residente.
- Cerrar TASK-006 antes de abrir la migracion de ejecucion de medicacion.
- Definir si la ficha viva se sirve desde `ResidentsService` o desde un read model/agregador dedicado antes de implementar TASK-005A.

## Cosas que NO hacer todavia

- No agregar nuevos bloques clinicos al `AdmissionsPanel`.
- No construir modulos separados de incidentes, signos vitales, observaciones o tareas antes de cerrar TASK-003 y TASK-004.
- No mezclar administracion de medicacion dentro de `MedicationOrder`.
- No crear una pantalla completa de personal/turnos mientras `StaffSchedule` siga sin flujo usable de punta a punta.
- No armar un motor complejo de alertas antes de tener alertas derivadas minimas.
