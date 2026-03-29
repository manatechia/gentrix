# Gentrix

Monorepo Nx para el sistema del geriatrico, con frontend React/Vite y backend NestJS.

Package manager oficial del repo: `pnpm`.

## Estructura

- `apps/frontend`: dashboard operativo del geriatrico.
- `apps/backend`: backend NestJS por modulos de dominio.
- `apps/backend/prisma`: schema, migraciones y seeds de PostgreSQL.
- `libs/domain/residents`: modelo base de residentes.
- `libs/domain/staff`: modelo base del equipo asistencial.
- `libs/domain/medication`: modelo base de medicacion.
- `libs/shared/types`: contratos compartidos entre frontend y backend.
- `libs/shared/utils`: utilidades compartidas.

## Documentacion De Arquitectura

- `docs/engineering-working-agreement.md`: decisiones tecnicas y de trabajo confirmadas.
- `docs/multitenancy-rbac-domain-north.md`: norte de dominio para multi-tenant, RBAC, pacientes, personal y acceso de familiares.
- `docs/domain-entity-model.md`: propuesta concreta de entidades, relaciones y corte recomendado para implementacion.
- `docs/prisma-phase-1-design.md`: corte concreto para la primera implementacion en Prisma y estrategia de migracion.
- `AGENT.md`: contexto operativo y advertencias para no confundir direccion futura con estado actual.

## Comandos

- `pnpm lint`: valida el baseline de ESLint del workspace.
- `pnpm serve:frontend`: levanta el frontend en `http://localhost:4200`.
- `pnpm serve:backend`: levanta el backend en `http://localhost:3333`.
- `pnpm build`: compila todos los proyectos Nx.
- `pnpm typecheck`: ejecuta typecheck del frontend.
- `pnpm check`: corre `lint` + `build` + `typecheck` del workspace.
- `pnpm show:projects`: lista los proyectos del workspace.
- `pnpm graph`: abre el grafo de dependencias.
- `pnpm prisma:generate`: genera el cliente de Prisma.
- `pnpm prisma:migrate:dev`: aplica migraciones sobre la base local.
- `pnpm prisma:seed`: carga seeds de desarrollo.
- `pnpm prisma:validate`: valida `prisma.config.ts` y el schema.

## Endpoints Backend

- `GET /api`: indice del servicio.
- `GET /api/health`: estado del backend.
- `POST /api/auth/login`: login con email y password.
- `GET /api/auth/session`: devuelve la sesion vigente usando bearer token.
- `POST /api/auth/logout`: cierra la sesion actual.
- `GET /api/dashboard`: snapshot operativo para el frontend.
- `GET /api/residents`: residentes resumidos.
- `GET /api/residents/:residentId`: detalle del residente.
- `POST /api/residents`: alta de residentes persistida en PostgreSQL via Prisma.
- `PUT /api/residents/:residentId`: actualizacion del perfil vigente del residente.
- `GET /api/residents/:residentId/clinical-history`: timeline clinico append-only.
- `POST /api/residents/:residentId/clinical-history`: agrega un evento clinico.
- `GET /api/staff`: personal resumido.
- `GET /api/staff/:staffId/schedules`: horarios por miembro del equipo.
- `POST /api/staff/:staffId/schedules`: agrega una guardia o cobertura.
- `PUT /api/staff/schedules/:scheduleId`: actualiza un horario existente.
- `GET /api/medications`: medicacion resumida.
- `GET /api/medications/:medicationId`: detalle de una orden.
- `GET /api/medications/catalog`: catalogo de medicacion disponible.
- `POST /api/medications`: crea una orden persistida en PostgreSQL via Prisma.
- `PUT /api/medications/:medicationId`: actualiza una orden existente.

## Credenciales Demo

- `admin@gentrix.local`
- `gentrix123`

## Docker

- `docker compose up -d --build` levanta `frontend`, `backend` y `postgres`.
- Frontend: `http://localhost:4200`
- Backend: `http://localhost:3333`
- PostgreSQL: `localhost:55432`
- Las imagenes base quedaron pinneadas a versiones actuales y compatibles del 27 de marzo de 2026:
  `node:22.22.2-bookworm-slim`, `postgres:16.13-alpine`, `nginx:1.28.3-alpine`.
- `frontend` ahora corre con Vite dentro de Docker y refleja cambios del repo por bind mounts + polling, sin rebuild por cada ajuste de UI.
- `backend` ahora tambien corre en modo desarrollo dentro de Docker con `nx serve backend`, bind mounts del workspace, Prisma al arranque y watch por polling para Docker Desktop.
- Para una vista estatica tipo produccion:
  `docker compose --profile preview up --build frontend-preview`
- El backend aplica `prisma migrate deploy` al arrancar.
- Si la base esta vacia y `AUTO_SEED_DEMO=true`, carga los datos demo una sola vez.
- Se pueden sobreescribir los puertos host con `FRONTEND_PORT`, `FRONTEND_PREVIEW_PORT`, `BACKEND_PORT` y `POSTGRES_PORT`.
- Para resetear todo el estado local: `docker compose down -v`
- Para resembrar manualmente una base ya creada: `docker compose exec backend node apps/backend/prisma/seed.mjs`

## Setup Local

1. Copiar `.env.example` a `.env`.
2. Instalar dependencias con `pnpm install`.
3. Generar cliente de Prisma con `pnpm prisma:generate`.
4. Aplicar migraciones con `pnpm prisma:migrate:dev`.
5. Cargar datos demo con `pnpm prisma:seed`.
6. Levantar backend con `pnpm serve:backend`.
7. Levantar frontend con `pnpm serve:frontend`.

Docker sigue siendo la baseline recomendada para levantar el stack completo, pero el flujo local queda documentado para reproducir `check`, Prisma y las apps por separado.

## Base De Datos

- Copiar `.env.example` a `.env` y ajustar `DATABASE_URL` segun el entorno local.
- La estructura PostgreSQL ya esta versionada en `prisma.config.ts`, `apps/backend/prisma/schema.prisma` y `apps/backend/prisma/migrations`.
- Los seeds iniciales cargan usuarios, residentes, medicacion, eventos clinicos y horarios.
- Residentes, medicacion, staff y schedules ya leen/escriben contra PostgreSQL via Prisma.
- Auth y sesion siguen en modo demo/simple; las sesiones actuales viven en memoria y se reinician al reiniciar el backend.
- El flujo de resident edit ya no reescribe eventos historicos: la historia clinica se agrega desde la ficha por endpoints append-only.
- El build del backend genera el cliente de Prisma antes de compilar.

## Nota De Desarrollo

El frontend usa proxy de Vite para redirigir `/api/*` al backend local en desarrollo.
El servicio `frontend` ya monta `apps/` y `libs/` dentro del contenedor y usa polling para reflejar cambios rapido en Docker Desktop.
El workspace de personal vive en `/personal` y usa los endpoints de schedules para gestionar turnos semanales y coberturas puntuales.
