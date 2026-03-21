# AGENT

## Proposito

Este archivo es la memoria operativa del proyecto `gentrix`.
Ante cualquier duda sobre arquitectura, estado actual o convenciones, consultar primero este archivo.
Para criterios de infraestructura, arquitectura objetivo y buenas practicas acordadas, consultar tambien `docs/engineering-working-agreement.md`.
Al final de cada prompt se debe actualizar este archivo para reflejar el nuevo estado del repositorio.

## Estado Actual

- Workspace: monorepo Nx integrado.
- Nombre del workspace: `gentrix`.
- Stack actual: Nx + TypeScript + React/Vite + NestJS.
- Direccion tecnica actual: frontend por features con router y backend NestJS + DDD con residentes persistidos en PostgreSQL/Prisma y otros modulos todavia en runtime in-memory.
- Direccion operativa recomendada: frontend con features dentro de `apps/frontend` por ahora y backend por modulos de dominio con capas claras.
- Persistencia inicial acordada: PostgreSQL + Prisma.
- Package manager: `pnpm`.
- Objetivo actual: base funcional de frontend y backend para el sistema del geriatrico.
- Producto MVP actual: consola unica con login separado y operacion integrada en un solo workspace.
- Alta de residentes actual: persiste en PostgreSQL via Prisma.
- Estado de base de datos: schema, migracion inicial y seed de Prisma ya versionados en `apps/backend/prisma`.

## Contexto De Negocio

- `gentrix` es un producto exclusivo para geriaticos.
- En el corto plazo el producto debe cubrir:
  - alta de pacientes
  - seguimiento de historia clinica
  - medicamentos diarios
  - alta de personal
  - datos completos de enfermeros y otros perfiles
  - manejo de horarios del personal
- Si mas adelante se reutilizan piezas en otros sistemas, la idea es reutilizar modulos ya construidos, no convertir `gentrix` en un producto generico desde el inicio.
- La historia clinica debe modelarse como timeline de eventos append-only.
- La medicacion diaria debe evolucionar a registro real de administracion por horario, aunque se pueda llegar por etapas.
- `soft delete` es la politica general para entidades de negocio.
- Los horarios del personal arrancan como turnos semanales con excepciones o coberturas.

## Fuentes De Contexto

- `AGENT.md`: memoria operativa, contexto de negocio y decisiones vigentes del producto.
- `docs/engineering-working-agreement.md`: acuerdo tecnico, infraestructura objetivo y buenas practicas a completar con el usuario.

## Direccion Visual

- La base visual global del proyecto toma como referencia la segunda imagen compartida por el usuario.
- El login toma como referencia la primera imagen compartida por el usuario.
- La tipografia oficial actual del producto es `Poppins`.
- Paleta base definida: Primary `#006684`, Secondary `#2F4F4F`, Tertiary `#885116`, Neutral `#F5F7F7`.

## Estructura Canonica

- `apps/frontend`: dashboard del geriatrico.
- `apps/backend`: backend NestJS que expone los datos del dashboard.
- `apps/backend/prisma`: schema, migraciones y seeds de PostgreSQL.
- `libs/shared/types`: contratos compartidos entre apps.
- `libs/shared/utils`: utilidades compartidas.
- `libs/domain/residents`: dominio de residentes.
- `libs/domain/staff`: dominio de personal.
- `libs/domain/medication`: dominio de medicacion.

## Comandos Relevantes

- `pnpm serve:frontend`: levanta el frontend.
- `pnpm serve:backend`: levanta el backend.
- `pnpm build`: compila todos los proyectos Nx.
- `pnpm typecheck`: ejecuta typecheck del frontend.
- `pnpm check`: corre build y typecheck del workspace.
- `pnpm show:projects`: lista los proyectos del workspace.
- `pnpm graph`: muestra el grafo de dependencias.
- `pnpm prisma:generate`: genera el cliente de Prisma.
- `pnpm prisma:migrate:dev`: aplica migraciones sobre PostgreSQL.
- `pnpm prisma:seed`: carga seeds de desarrollo.
- `pnpm prisma:validate`: valida `prisma.config.ts` y el schema.

## Endpoints Actuales

- `GET /api`: indice del backend.
- `GET /api/health`: healthcheck.
- `POST /api/auth/login`: login con credenciales demo.
- `GET /api/auth/session`: sesion actual via bearer token.
- `POST /api/auth/logout`: invalida la sesion actual.
- `GET /api/dashboard`: snapshot operativo del geriatrico.
- `GET /api/residents`: residentes resumidos.
- `POST /api/residents`: alta de residentes persistida en PostgreSQL via Prisma.
- `GET /api/staff`: personal resumido.
- `GET /api/medications`: medicacion resumida.

## Decisiones Tomadas

- El repo usa layout Nx con `apps/` y `libs/`.
- El package manager oficial del repo es `pnpm`.
- Los imports internos usan alias `@gentrix/*`.
- El `package.json` raiz tiene `nx.includedScripts: []` para evitar recursion de Nx con scripts raiz.
- La app backend vive en `apps/backend`, usa NestJS y compila con `@nx/esbuild`.
- La app frontend vive en `apps/frontend` y usa React + Vite.
- El frontend consume el backend via `/api/*` y en desarrollo usa proxy de Vite a `http://localhost:3333`.
- El monorepo Nx se mantiene por ahora, pero la arquitectura debe permitir separar frontend y backend rapidamente si el proyecto escala.
- El acceso al dashboard requiere autenticacion.
- La sesion actual usa tokens en memoria y se pierde al reiniciar el backend.
- Los contratos de respuesta del dashboard viven en `libs/shared/types`.
- El frontend debe evolucionar a una arquitectura con router y organizacion por features.
- En el estado actual del monorepo, tiene sentido mantener las features frontend dentro de `apps/frontend` y no forzar libs Nx por feature todavia.
- Cada feature frontend debe separar `ui`, `hooks`, `services`, `schemas` y tipos propios cuando aplique.
- Debe existir un espacio `shared/ui` y `shared/lib` para frontend.
- La estructura inicial acordada del frontend es `apps/frontend/src/features/<feature>/{ui,hooks,services,schemas,types}` y `apps/frontend/src/shared/{ui,lib,config}`.
- El frontend debe centralizar HTTP en servicios con `axios`.
- La logica del frontend debe vivir en hooks y no en componentes visuales.
- Los formularios del frontend deben usar `Formik` + `Yup`.
- El backend ya migro a `NestJS` con enfoque DDD basico por modulos.
- El backend debe organizarse por modulos de dominio como `patients`, `staff`, `medication`, `auth`, `clinical-history` y `schedules`.
- Cada modulo backend debe separar `application`, `domain`, `infrastructure` y `presentation`.
- Los casos de uso backend deben depender de interfaces de repositorio.
- La validacion backend debe usar DTO + `class-validator`.
- La persistencia objetivo del backend es PostgreSQL.
- `Prisma` es la tecnologia inicial acordada para acceso a PostgreSQL.
- La politica de borrado debe ser `soft delete`.
- Las entidades deben usar UUID como identificador tecnico.
- Deben existir migraciones y seeds desde el inicio cuando entremos a persistencia real.
- Los permisos del MVP seran simples, pero la arquitectura debe poder crecer a RBAC.
- La auditoria de cambios es un requerimiento del producto.
- La auditoria minima obligatoria es `createdAt`, `createdBy`, `updatedAt`, `updatedBy`, `deletedAt` y `deletedBy`.
- La calidad minima para merge debe incluir `typecheck` y `lint`.
- La estrategia inicial de testing sera minima y enfocada en unit tests para logica.
- No se quiere depender de validacion ejecutable compartida entre frontend y backend, para no dificultar una futura separacion de repositorios.
- El sistema visual base del producto usa la referencia de la segunda imagen aportada por el usuario.
- El login debe mantenerse alineado a la composicion de la primera imagen aportada por el usuario.
- La fuente transversal del frontend es `Poppins`.
- El frontend debe usar Tailwind CSS como sistema unico de estilos; no mantener CSS Modules para la UI principal.
- El MVP no separa un panel de admin: residentes, staff, medicacion, alertas y altas viven en la misma consola.
- El dashboard usa un sidebar como navegacion primaria del workspace.
- El sidebar del dashboard debe mantenerse como sidebar tradicional sticky pegado al borde izquierdo en desktop.
- El sidebar del dashboard no debe tener scroll interno y no debe superar el alto de la pantalla en desktop.
- La accion `Cerrar sesion` debe vivir al pie del sidebar, no en el header del contenido.
- El footer del sidebar debe quedar anclado abajo por layout, no solo por orden visual.
- El nombre y resumen del usuario logueado deben vivir en el footer del sidebar, por encima de `Cerrar sesion`.
- La escala tipografica global del frontend quedo reducida respecto de la version anterior.
- El alta de pacientes vive en frontend dentro de la misma shell y persiste en PostgreSQL via Prisma.
- La composicion del frontend debe mantenerse separada en componentes por seccion y hooks/lib para estado y utilidades.
- Se agrego un acuerdo tecnico versionable en `docs/engineering-working-agreement.md` para centralizar decisiones de infraestructura y buenas practicas.

## Convenciones

- Mantener la separacion entre `apps`, `libs/shared` y `libs/domain`.
- Reutilizar tipos desde `libs/shared/types` antes de duplicar contratos.
- Reutilizar helpers desde `libs/shared/utils` antes de crear utilidades locales.
- Si aparece un nuevo modulo funcional, priorizar estructura por dominio.
- Mantener ASCII por defecto en codigo y documentacion tecnica.
- En frontend, centralizar estilos base y tokens en Tailwind/theme global antes de reintroducir hojas de estilo locales.
- Actualizar este archivo al final de cada intervencion.

## Pendientes Probables

- Migrar staff, medicacion y autenticacion demo a Prisma/PostgreSQL para cerrar el gap con residentes.
- Evaluar mover la nueva estructura del frontend a libs Nx (`data-access`, `feature`, `ui`) cuando deje de ser suficiente la separacion interna en `apps/frontend`.
- Agregar tests reales para frontend, backend y librerias.
- Incorporar autenticacion y configuracion por entorno.
- Completar con el usuario el acuerdo tecnico en `docs/engineering-working-agreement.md`.
- Expandir el contexto de negocio estable en este archivo a medida que el usuario lo defina.
- Definir si activaremos boundaries estrictos de Nx cuando empecemos a extraer libs.
- Definir reglas de naming y ownership tecnico.
- Detallar el modelo de horarios cuando el dominio madure.

## Archivos Clave

- `package.json`
- `nx.json`
- `tsconfig.base.json`
- `apps/frontend/src/app/router.tsx`
- `apps/frontend/src/features/`
- `apps/frontend/src/shared/`
- `apps/frontend/src/styles.css`
- `apps/backend/src/main.ts`
- `apps/backend/src/app.module.ts`
- `apps/backend/src/modules/`
- `apps/backend/src/infrastructure/prisma/`
- `prisma.config.ts`
- `apps/backend/prisma/schema.prisma`
- `README.md`
- `AGENT.md`
- `docs/engineering-working-agreement.md`

## Verificacion Reciente

- `nx run-many -t build,typecheck --outputStyle=static`
- Estado: OK el 2026-03-19
- `pnpm check`
- Estado: OK el 2026-03-19
- `corepack pnpm check`
- Estado: OK el 2026-03-19 luego del rediseno visual del frontend
- `corepack pnpm check`
- Estado: OK el 2026-03-19 luego de integrar sidebar y alta de pacientes al MVP
- `corepack pnpm check`
- Estado: OK el 2026-03-19 luego de convertir el sidebar en layout tradicional sticky a la izquierda
- `corepack pnpm check`
- Estado: OK el 2026-03-19 luego de mover `Cerrar sesion` al footer del sidebar
- `corepack pnpm check`
- Estado: OK el 2026-03-19 luego de limitar el sidebar a `100vh` sin scroll interno
- `corepack pnpm check`
- Estado: OK el 2026-03-19 luego de anclar el footer del sidebar al fondo real
- `corepack pnpm check`
- Estado: OK el 2026-03-19 luego de mover el resumen del usuario al footer del sidebar
- `corepack pnpm check`
- Estado: OK el 2026-03-19 luego de reducir la escala tipografica del frontend
- `corepack pnpm check`
- Estado: OK el 2026-03-19 luego de migrar el frontend principal a Tailwind y separar la UI en componentes
- `corepack pnpm check`
- Estado: OK el 2026-03-20 luego de conectar el alta de residentes a PostgreSQL via Prisma y mantener `POST /api/residents`
- `corepack pnpm check`
- Estado: OK el 2026-03-20 luego de migrar frontend y backend a la nueva infraestructura base
- Smoke test: login `POST /api/auth/login` + acceso autenticado a `GET /api/dashboard`
- Estado: OK el 2026-03-19

## Registro De Cambios

### 2026-03-19

- Se inicializo el monorepo Nx desde cero en este directorio.
- Se crearon librerias shared y de dominio para residentes, personal y medicacion.
- Se agrego `AGENT.md` como fuente de contexto persistente.
- Se renombro la app inicial a `apps/backend`.
- Se creo `apps/frontend` con React + Vite.
- Se implemento un dashboard conectado a `GET /api/dashboard`.
- Se agregaron endpoints `/api/health`, `/api/dashboard`, `/api/residents`, `/api/staff` y `/api/medications`.
- Se verifico el workspace con build y typecheck exitosos.
- Se dejo documentado el arranque local: backend en `localhost:3333` y frontend en `localhost:4200`.
- Se migro el workspace de `npm` a `pnpm`.
- Se agregaron `pnpm-workspace.yaml` y `packageManager: pnpm@10.32.1`.
- Se genero `pnpm-lock.yaml` y se elimino `package-lock.json`.
- Se implemento login funcional en backend con `login`, `session` y `logout`.
- Se protegio el dashboard en frontend y backend usando bearer token.
- Se agregaron credenciales demo `admin@gentrix.local` / `gentrix123`.
- Se redefinio la direccion visual del frontend usando como base la segunda referencia visual del usuario.
- Se rehizo el login para seguir la primera referencia visual del usuario.
- Se adopto `Poppins` como fuente oficial del frontend.
- Se verifico el workspace luego del rediseno visual con `corepack pnpm check`.
- Se incorporo sidebar al dashboard para sostener el MVP de consola unica.
- Se agrego un flujo de alta de pacientes dentro del mismo frontend, sin panel de admin separado.
- Se verifico el workspace luego de integrar sidebar y alta de pacientes con `corepack pnpm check`.
- Se ajusto el dashboard a un sidebar tradicional sticky pegado al borde izquierdo.
- Se verifico el workspace luego del ajuste del sidebar con `corepack pnpm check`.
- Se movio `Cerrar sesion` al footer del sidebar para consolidar las acciones globales del workspace.
- Se verifico el workspace luego de mover el logout al sidebar con `corepack pnpm check`.
- Se limito el sidebar a `100vh` sin scroll interno y se comprimio su contenido para mantenerlo dentro de pantalla.
- Se verifico el workspace luego de limitar el sidebar con `corepack pnpm check`.
- Se reforzo el sidebar con layout en columna para fijar el footer de logout al fondo real.
- Se verifico el workspace luego de anclar el footer del sidebar con `corepack pnpm check`.
- Se movio el resumen del usuario logueado al footer del sidebar, encima del boton de logout.
- Se verifico el workspace luego de mover el resumen del usuario al sidebar con `corepack pnpm check`.
- Se redujo la escala tipografica global del frontend y de los titulos principales.
- Se verifico el workspace luego de ajustar la tipografia con `corepack pnpm check`.
- Se adopto Tailwind CSS como sistema de estilos del frontend y se elimino `app.module.css` de la shell principal.
- Se separo el frontend en componentes de auth, sidebar, toolbar, header, metricas y paneles del dashboard.
- Se centralizo el estado de la app en `use-gentrix-app` y se aislaron tokens/clases reutilizables en `lib/`.
- Se verifico el workspace luego de migrar el frontend a Tailwind y modularizar la UI con `corepack pnpm check`.

### 2026-03-20

- Se conecto `POST /api/residents` a PostgreSQL via Prisma para persistir altas reales de residentes.
- Se dockerizo el monorepo con `docker compose`, imagenes separadas para frontend/backend, Nginx para el frontend y PostgreSQL para la base local.
- Se agrego bootstrap de contenedores para correr `prisma migrate deploy` al arrancar el backend y sembrar demo data solo si la base esta vacia.
- Se conecto el formulario de altas del frontend al backend y se elimino el draft local como fuente principal.
- Se creo `docs/engineering-working-agreement.md` como cuestionario y acuerdo tecnico versionable.
- Se actualizo `AGENT.md` para reflejar el nuevo estado del flujo de residentes y la nueva fuente de decisiones tecnicas.
- Se registraron las primeras decisiones tecnicas del usuario: producto orientado a geriaticos, frontend por features con router, servicios `axios`, formularios con `Formik` + `Yup`, backend objetivo en NestJS + DDD + PostgreSQL, permisos simples con camino a RBAC y gating minimo por `typecheck` + `lint`.
- Se confirmaron `Prisma` como acceso inicial a PostgreSQL, la auditoria minima base, la estructura inicial del frontend por features dentro de `apps/frontend` y el modelado inicial de horarios como turnos semanales con excepciones o coberturas.
- Se migro el frontend a router + features folders + `axios` con cliente compartido y autenticacion centralizada en hooks.
- Se migro el backend operativo a NestJS con modulos `auth`, `residents`, `staff`, `medication` y `system`.
- Se eliminaron los handlers HTTP legacy como ruta activa y se dejo Prisma preparado a nivel schema/config sin activarlo todavia en el boot runtime.
- Se versionaron schema, migracion inicial y seeds de Prisma para PostgreSQL.
- Se alinearon los IDs tecnicos del dominio y de la base a UUIDs.
- Se corrigio la inyeccion explicita de Nest en controllers y servicios sensibles para que el bundle de `esbuild` no deje dependencias en `undefined`.
- Se reforzo el filtro global de errores para exponer el mensaje real en desarrollo y loguear stacks en 500s.
- Se corrigieron IDs duplicados en seeds de residentes, medicacion y staff para evitar colisiones de keys en React durante el dashboard.
- Se agregaron logs de desarrollo alrededor del alta de residentes y deduplicacion defensiva en el frontend para listas con IDs repetidos.
- Se reemplazo el fallback de `checking` del router para no renderizar la pantalla de login durante la restauracion de sesion.
- Se agregaron trazas de desarrollo en `AuthSessionProvider` para detectar `beforeunload`, `pagehide` y remounts del arbol al depurar blinks o reloads.
