# Tareas MVP Residentes

## Proposito

Backlog corto y accionable para llevar el repo actual al MVP centrado en residentes definido en `docs/mvp-residentes-scope.md`.

Este archivo no reemplaza `TASKS_ROADMAP.md`.
Lo complementa con un recorte mas chico y mas cercano al producto que hoy queremos cerrar.

## Reglas de uso

- no abrir tareas que expandan personal o administracion como pilares propios
- toda tarea debe mejorar uno de los flujos criticos del residente
- aprovechar lo que ya existe antes de abrir modulos nuevos
- si una tarea obliga a una decision de dominio grande, dejarla explicita y acotada
- estado por defecto: `pending`

## Fase 0. Cerrar el recorte

### MVP-RES-01 - Congelar el corte residente-first en la shell del producto

- Estado: `pending`
- Prioridad: alta
- Estimacion: S
- Objetivo: alinear navegacion, labels y foco del producto con el recorte de residentes.
- Aprovecha lo actual: ya existen rutas para residentes, handoff, dashboard, staff y medicacion.
- Toca: `apps/frontend/src/app/router.tsx`, sidebar/dashboard shell, docs de producto si hace falta.
- Dependencias: ninguna.
- Definition of Done: `residentes` y `handoff` quedan como recorrido principal; `dashboard`, `staff` y `medicacion` dejan de leerse como pilares equivalentes del MVP.

## Fase 1. Admision y ficha del residente

### MVP-RES-02 - Separar historia de vida de historia clinica

- Estado: `pending`
- Prioridad: alta
- Estimacion: M
- Objetivo: capturar habitos, gustos, rutinas, vinculos y contexto emocional/social en un bloque propio.
- Aprovecha lo actual: la ficha ya tiene `clinicalProfile`, `familyContacts`, `belongings` y paneles de alta/edicion.
- Toca: `libs/shared/types`, `apps/backend/prisma/schema.prisma`, DTOs/backend de residentes, `admissions-panel.tsx`, `resident-detail-workspace.tsx`, `resident-edit-workspace.tsx`.
- Dependencias: MVP-RES-01.
- Definition of Done: la UI y la API exponen una seccion separada de historia de vida; ya no se mezcla con historia clinica ni con notas operativas.

### MVP-RES-03 - Convertir el alta en admision + valoracion inicial minima

- Estado: `pending`
- Prioridad: alta
- Estimacion: M
- Objetivo: estructurar una valoracion minima de ingreso sobre movilidad, alimentacion, piel, dependencia y equipamiento.
- Aprovecha lo actual: el formulario de admision ya captura parte del contexto y datos clinicos.
- Toca: contratos compartidos del residente, persistencia Prisma, mapeos backend, formulario de admision y detalle/edit del residente.
- Dependencias: MVP-RES-02.
- Definition of Done: al crear un residente queda registrado un bloque de valoracion inicial editable despues, sin depender de texto libre disperso.

### MVP-RES-04 - Definir el corte minimo de ubicacion operativa

- Estado: `pending`
- Prioridad: media
- Estimacion: S
- Objetivo: decidir si el MVP usa solo habitacion o habitacion + cama, manteniendo la identidad centrada en la persona.
- Aprovecha lo actual: hoy el modelo ya tiene `room` como dato operativo.
- Toca: `libs/shared/types`, schema Prisma si entra `bed`, formularios y vistas del residente.
- Dependencias: MVP-RES-01.
- Definition of Done: queda cerrada y documentada la ubicacion minima del MVP; el residente nunca se identifica por cama.

## Fase 2. Operacion diaria

### MVP-RES-05 - Reorientar el timeline a registro por excepcion

- Estado: `pending`
- Prioridad: alta
- Estimacion: M
- Objetivo: ampliar el modelo de eventos del residente con tipos utiles para novedades reales del geriatrico.
- Aprovecha lo actual: ya existe timeline append-only y panel de historia clinica.
- Toca: `resident-event-model` si hace falta actualizarlo, `libs/shared/types`, controladores/servicios de `clinical-history`, panel de timeline en frontend.
- Dependencias: MVP-RES-02.
- Definition of Done: se pueden registrar excepciones como cambios de conducta, alimentacion, eliminacion, lesiones, incidentes y notas de turno sin obligar un checklist exhaustivo.

### MVP-RES-06 - Implementar observacion como flujo propio

- Estado: `pending`
- Prioridad: alta
- Estimacion: L
- Objetivo: permitir abrir, seguir y cerrar observaciones activas del residente entre turnos.
- Aprovecha lo actual: existen timeline, handoff y ficha viva, pero no un estado de observacion propiamente dicho.
- Toca: schema Prisma o nuevo modelo derivado, backend de residentes/handoff, shared types, resident detail, handoff workspace.
- Dependencias: MVP-RES-05.
- Definition of Done: un residente puede quedar en observacion con motivo, seguimiento y cierre explicito; la observacion impacta en ficha y handoff.

### MVP-RES-07 - Trazabilidad minima de deteccion, validacion y escalamiento

- Estado: `pending`
- Prioridad: alta
- Estimacion: M
- Objetivo: registrar quien detecto una novedad, quien la valido y si se escalo a responsable, medico o emergencia.
- Aprovecha lo actual: hoy existen `actor` string en eventos y datos de sesion simples.
- Toca: contratos de eventos/observaciones, backend de clinical history o nuevo flujo de observacion, medication executions si aportan al mismo relato operativo.
- Dependencias: MVP-RES-05.
- Definition of Done: cada novedad critica u observacion deja trazabilidad minima de actor y escalamiento, sin abrir todavia un RBAC profundo.

### MVP-RES-08 - Rehacer handoff sobre observaciones y excepciones abiertas

- Estado: `pending`
- Prioridad: alta
- Estimacion: M
- Objetivo: convertir handoff en el flujo operativo principal entre turnos, residente por residente.
- Aprovecha lo actual: ya existe `apps/frontend/src/features/handoff` y una base backend para snapshots operativos.
- Toca: `apps/frontend/src/features/handoff`, `apps/backend/src/modules/system` o modulo dedicado de handoff, shared types del snapshot.
- Dependencias: MVP-RES-06, MVP-RES-07.
- Definition of Done: el handoff muestra residentes con observaciones abiertas, excepciones recientes y pendientes relevantes para el turno siguiente.

## Fase 3. Soportes minimos del MVP

### MVP-RES-09 - Encajar medicacion dentro del flujo del residente

- Estado: `pending`
- Prioridad: media
- Estimacion: M
- Objetivo: mantener medicacion activa y ejecucion basica solo como soporte de ficha viva y handoff.
- Aprovecha lo actual: ya hay ordenes, ejecuciones, alertas y paneles de medicacion.
- Toca: resident live profile, handoff, vistas de medicacion y navegacion principal.
- Dependencias: MVP-RES-08.
- Definition of Done: la medicacion que importa para el MVP vive integrada al recorrido del residente; no se abre alcance de catalogo, reportes ni gestion avanzada.

### MVP-RES-10 - Dejar personal y administracion en modo soporte

- Estado: `pending`
- Prioridad: media
- Estimacion: S
- Objetivo: evitar que staff, stock, billing o dashboards ejecutivos vuelvan a competir por prioridad dentro del MVP.
- Aprovecha lo actual: ya hay modulo y rutas, pero siguen marcados como no validados o secundarios.
- Toca: docs, labels de navegacion, criterio de backlog y posiblemente visibilidad de rutas.
- Dependencias: MVP-RES-01.
- Definition of Done: el backlog vigente no abre tareas nuevas de staff/admin salvo las que destraben un flujo del residente.

### MVP-RES-11 - Cubrir los flujos criticos con integracion y E2E

- Estado: `pending`
- Prioridad: alta
- Estimacion: L
- Objetivo: asegurar que el recorrido principal del residente no se rompa mientras se achica y reordena el producto.
- Aprovecha lo actual: ya existe frontend E2E y el repo usa Playwright.
- Toca: `apps/frontend-e2e`, specs backend de residentes/clinical history/medication y helpers compartidos.
- Dependencias: MVP-RES-03, MVP-RES-06, MVP-RES-08, MVP-RES-09.
- Definition of Done: hay cobertura automatizada para `listado -> alta -> ficha -> novedad -> observacion -> handoff` y, si queda en alcance, para medicacion basica.

## Fase 4. Pendientes siguientes

- Nota: dentro de esta fase, el orden sigue prioridad operativa real. Los IDs se mantienen estables aunque no queden en orden numerico.

### MVP-RES-13 - Auditoria minima de cambios con updatedAt y updatedBy

- Estado: `done`
- Prioridad: alta
- Estimacion: M
- Objetivo: registrar quien hizo cambios relevantes y cuando, especialmente sobre estados operativos y eventos del residente.
- Aprovecha lo actual: ya existen sesion, actor minimo y modelos con timestamps parciales.
- Toca: `apps/backend/prisma/schema.prisma`, servicios/backend que cambian estados, `libs/shared/types`, vistas donde se muestra trazabilidad si aplica.
- Dependencias: ninguna.
- Definition of Done: los cambios relevantes persisten `updatedAt` y `updatedBy`; la trazabilidad basica queda disponible para auditoria operativa.

### MVP-RES-16 - Extender observacion con seguimiento y desenlace

- Estado: `pending`
- Prioridad: alta
- Estimacion: L
- Objetivo: modelar observaciones con subeventos de seguimiento y un desenlace claro, por ejemplo `no comio -> seguimiento -> llamar/ir al medico -> cierre`.
- Aprovecha lo actual: ya esta planteado abrir/cerrar observaciones y registrar novedades en timeline.
- Toca: `docs/resident-event-model.md`, `libs/shared/types`, backend de residentes/clinical history/handoff, ficha del residente y timeline.
- Dependencias: MVP-RES-06, MVP-RES-07.
- Definition of Done: una observacion admite seguimiento interno, acciones tomadas y cierre explicito; la ficha y el handoff cuentan esa secuencia completa.

### MVP-RES-18 - Incorporar VGI en el alta del residente

- Estado: `pending`
- Prioridad: media
- Estimacion: M
- Objetivo: sumar al alta una `Valoracion Geriatrica Integral` estructurada, sin dejarla dispersa en texto libre.
- Aprovecha lo actual: el alta ya viene absorbiendo parte de la valoracion inicial minima.
- Toca: `libs/shared/types`, `apps/backend/prisma/schema.prisma`, backend de residentes, `admissions-panel.tsx`, detalle/edicion del residente y docs si hace falta cerrar el instrumento minimo.
- Dependencias: MVP-RES-03.
- Definition of Done: el alta incluye un bloque claro de VGI editable despues; sus datos quedan persistidos y visibles en la ficha.

### MVP-RES-17 - Clasificar modalidad de residente

- Estado: `pending`
- Prioridad: media
- Estimacion: S
- Objetivo: distinguir si la persona pertenece a `Residencia de Larga Estadia`, `Hogar de dia` o `Guarderia / RLE temporal`.
- Aprovecha lo actual: el alta ya captura datos administrativos y contexto del residente.
- Toca: `libs/shared/types`, `apps/backend/prisma/schema.prisma`, DTOs/backend de residentes, formulario de alta/edicion y vistas de ficha/listado si corresponde.
- Dependencias: MVP-RES-03.
- Definition of Done: la modalidad del residente queda guardada y visible en los recorridos donde aporta contexto operativo.

### MVP-RES-12 - Reinicio de contrasena y cambio obligatorio en primer ingreso

- Estado: `pending`
- Prioridad: media
- Estimacion: M
- Objetivo: permitir que administracion recupere accesos perdidos y que todo usuario nuevo defina una contrasena propia al entrar por primera vez.
- Aprovecha lo actual: ya existe modulo admin de usuarios, login y persistencia de credenciales.
- Toca: `apps/frontend/src/features/users`, `apps/frontend/src/features/auth`, `apps/backend/src/modules/users`, `apps/backend/src/modules/auth`, `apps/backend/prisma/schema.prisma`, `libs/shared/types`.
- Dependencias: ninguna.
- Definition of Done: admin puede reiniciar contrasenas desde `personal`; un usuario nuevo queda marcado para cambio obligatorio de contrasena en su primer login.

### MVP-RES-15 - Dashboards distintos por tipo de usuario

- Estado: `pending`
- Prioridad: media
- Estimacion: M
- Objetivo: adaptar la home operativa segun el perfil: asistentes ven su dia a dia, enfermeria ve tambien lo asistencial y admin ve el geriatrico completo.
- Aprovecha lo actual: ya existe dashboard, shell con permisos y roles operativos basicos.
- Toca: `apps/frontend/src/features/dashboard`, `apps/frontend/src/shared/lib/authz.ts`, consultas backend que alimentan paneles y contratos compartidos si cambia el payload.
- Dependencias: MVP-RES-10, MVP-RES-13.
- Definition of Done: cada rol aterriza en un dashboard acorde a su alcance operativo sin perder el flujo principal del residente.

### MVP-RES-14 - Agenda operativa por residente

- Estado: `pending`
- Prioridad: media
- Estimacion: L
- Objetivo: centralizar por residente una agenda con medicaciones periodicas, turnos medicos y actividades como yoga, gym u otras rutinas.
- Aprovecha lo actual: ya existe base de medicacion, ficha del residente y eventos diarios.
- Toca: `libs/shared/types`, `apps/backend/src/modules/residents`, `apps/backend/src/modules/medication`, frontend de ficha/listado del residente y modelo Prisma si hace falta agenda dedicada.
- Dependencias: MVP-RES-03, MVP-RES-09.
- Definition of Done: cada residente puede tener una agenda visible con items recurrentes y puntuales; la ficha muestra lo proximo sin mezclarlo con el timeline historico.

## Tareas que no deberian abrirse mientras tanto

- stock e insumos
- facturacion y pricing
- portal de familiares
- reportes financieros
- RBAC profundo por rol y facility
- modulo completo de horarios del personal como frente principal
- dashboard ejecutivo como home del producto

