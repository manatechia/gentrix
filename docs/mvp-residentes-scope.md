# Scope MVP Residentes

## Proposito

Este documento recorta el MVP de producto usando como base:

- `resumen-discovery-geriatrico.md`
- `AGENTS.md`
- `README.md`

La decision central es simple:

**el MVP queda centrado en residentes**.

Los pilares de personal y administracion solo entran cuando sostienen el flujo del residente y su continuidad de cuidado.

## Cambio de criterio

El repo ya crecio con rutas, modulos y tareas para `dashboard`, `staff`, `medication` y `handoff`.
Tambien hay documentos mas viejos donde el MVP aparece mas amplio.

Con el discovery nuevo y el estado real del repo, conviene achicar el corte de producto:

- residentes pasa a ser el nucleo
- personal queda como soporte operativo minimo
- administracion queda como base tecnica y documental minima

Este documento debe leerse como el recorte de producto vigente, aunque haya piezas tecnicas ya construidas por fuera de este corte.

## Foto del proyecto hoy

### Ya existe en el repo

- flujo base de residentes: listado, alta, ficha, edicion
- timeline clinico append-only
- ficha viva con eventos recientes y medicacion activa
- ejecucion basica de medicacion
- vista de handoff
- modulos separados para personal, dashboard y medicacion
- persistencia en Prisma para residentes, staff, schedules y medicacion

### Todavia esta flojo o no validado

- `dashboard` como pantalla principal de producto
- `staff` como modulo realmente priorizado
- `medication` como pilar independiente del flujo del residente
- auth, sesion y permisos como producto confiable
- observacion como flujo propio
- historia de vida separada de historia clinica
- pase de guardia modelado como flujo residente-centrico
- valoracion de ingreso como bloque estructurado

## Criterios de inclusion al MVP

Un tema entra al MVP si cumple al menos una de estas condiciones:

- mejora la continuidad del cuidado del residente entre turnos
- resuelve una parte critica de la operacion diaria del residente
- ya tiene una base util en el repo y requiere un ajuste razonable
- evita que el equipo se disperse en pilares que hoy no estan validados

Un tema no entra si:

- abre un pilar entero de personal o administracion
- exige modelado profundo que no destraba el flujo del residente
- es importante, pero no critico para la primera puesta en marcha

## Corte por pilar

## 1. Residentes

### Entra al MVP

- listado de residentes con estado actual minimo
- alta de residente con datos personales, responsables y contacto de emergencia
- ficha del residente con edicion de datos base
- historia clinica append-only
- historia de vida basica separada de la historia clinica
- valoracion de ingreso minima
- VGI minima estructurada con cognition, movilidad, alimentacion, piel, dependencia, animo y apoyos
- registro diario por excepcion, no checklist exhaustivo
- observacion como estado operativo abierto y cerrable
- handoff centrado en residentes
- medicacion activa y ejecucion basica solo como soporte del residente
- ubicacion actual como dato operativo del residente
- trazabilidad minima de quien detecto, quien valido y si hubo escalamiento

### No entra al MVP

- modelado exhaustivo de todas las prestaciones interdisciplinarias
- historial fino de traslados y ocupacion completa
- modulos separados para cada tipo de incidente o practica
- reportes clinicos avanzados
- firma profesional fuerte o circuito medico completo
- carga exhaustiva de signos y controles de rutina

### Queda abierto

- si cama entra en v1 o si alcanza con habitacion
- que observaciones requieren validacion de enfermeria
- que eventos pasan a historia formal y cuales quedan solo para handoff

## 2. Personal

### Entra al MVP

- actor minimo para saber quien registro algo sobre un residente
- semantica minima de roles para distinguir asistente, enfermeria y responsable
- validacion minima cuando haga falta sostener observacion o escalamiento

### No entra al MVP

- modulo completo de personal como pilar comercial
- gestion completa de horarios, coberturas y dotacion
- tablero operativo del staff
- RBAC profundo por rol, sede y permiso fino

### Queda abierto

- cuanto del flujo de observacion tiene que pasar por enfermeria
- si vale la pena exponer la pantalla de personal en la navegacion principal del MVP

## 3. Administracion

### Entra al MVP

- organizacion y facility como contexto tecnico del sistema
- auditoria basica
- datos minimos que hagan posible una ficha valida del residente

### No entra al MVP

- stock e insumos
- billing, cobranzas y pricing por complejidad
- reportes financieros
- portal de familiares
- cumplimiento normativo fino y reportes de inspeccion
- dashboards ejecutivos como foco principal

### Queda abierto

- que evidencia documental piden realmente en inspecciones
- que reportes de cumplimiento valen la pena en una segunda etapa

## Flujos prioritarios del MVP

Estos son los flujos que si o si tienen que quedar bien:

1. `listado -> alta -> ficha -> edicion`
2. `ficha -> registro de novedad por excepcion`
3. `ficha -> apertura de observacion -> seguimiento -> cierre`
4. `ficha/handoff -> medicacion activa y ejecucion basica`
5. `handoff -> entrega y recepcion residente por residente`

Si una funcionalidad no mejora alguno de estos cinco flujos, en principio no deberia abrirse dentro del MVP.

## Traduccion al repo actual

### Lo que podemos aprovechar casi directo

- `apps/frontend/src/features/residents`
- `apps/frontend/src/features/handoff`
- `apps/frontend/src/features/medication` en lo que ya alimenta ficha viva y handoff
- `apps/backend/src/modules/residents`
- `apps/backend/src/modules/clinical-history`
- `apps/backend/src/modules/medication`
- `libs/shared/types`

### Lo que hay que reencuadrar

- `dashboard` deja de ser el centro del MVP
- `staff` deja de ser un frente principal y pasa a soporte
- `medication` deja de crecer como pilar separado y se ata al flujo del residente

### Lo que falta construir o ajustar

- historia de vida separada
- valoracion de ingreso minima
- observacion como flujo propio
- registro por excepcion con tipos mas utiles
- handoff realmente residente-centrico
- trazabilidad minima de escalamiento

## Regla operativa para decidir

Ante cualquier duda de alcance:

- si mejora al residente hoy, entra
- si solo organiza al personal pero no cambia el cuidado del residente, espera
- si es administrativo y no destraba la operacion diaria del residente, queda fuera

