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

## Comandos

- `pnpm serve:frontend`: levanta el frontend en `http://localhost:4200`.
- `pnpm serve:backend`: levanta el backend en `http://localhost:3333`.
- `pnpm build`: compila todos los proyectos Nx.
- `pnpm typecheck`: ejecuta typecheck del frontend.
- `pnpm check`: corre build y typecheck del workspace.
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
- `POST /api/residents`: alta de residentes persistida en PostgreSQL via Prisma.
- `GET /api/staff`: personal resumido.
- `GET /api/medications`: medicacion resumida.

## Credenciales Demo

- `admin@gentrix.local`
- `gentrix123`

## Docker

- `docker compose up --build` levanta `frontend`, `backend` y `postgres`.
- Frontend: `http://localhost:4200`
- Backend: `http://localhost:3333`
- PostgreSQL: `localhost:55432`
- `frontend` ahora corre con Vite dentro de Docker y refleja cambios del repo por bind mounts + polling, sin rebuild por cada ajuste de UI.
- Para una vista estatica tipo produccion:
  `docker compose --profile preview up --build frontend-preview`
- El backend aplica `prisma migrate deploy` al arrancar.
- Si la base esta vacia y `AUTO_SEED_DEMO=true`, carga los datos demo una sola vez.
- Se pueden sobreescribir los puertos host con `FRONTEND_PORT`, `FRONTEND_PREVIEW_PORT`, `BACKEND_PORT` y `POSTGRES_PORT`.
- Para resetear todo el estado local: `docker compose down -v`
- Para resembrar manualmente una base ya creada: `docker compose exec backend node apps/backend/prisma/seed.mjs`

## Base De Datos

- Copiar `.env.example` a `.env` y ajustar `DATABASE_URL` segun el entorno local.
- La estructura PostgreSQL ya esta versionada en `prisma.config.ts`, `apps/backend/prisma/schema.prisma` y `apps/backend/prisma/migrations`.
- Los seeds iniciales cargan usuarios, residentes, medicacion, eventos clinicos y horarios.
- Residentes ya leen y escriben contra PostgreSQL via Prisma.
- Staff, medicacion y autenticacion demo todavia usan repositorios in-memory.
- Prisma ya se inicializa en el arranque del backend para el modulo de residentes.

## Nota De Desarrollo

El frontend usa proxy de Vite para redirigir `/api/*` al backend local en desarrollo.
El servicio `frontend` ya monta `apps/` y `libs/` dentro del contenedor y usa polling para reflejar cambios rapido en Docker Desktop.
Las sesiones actuales viven en memoria del backend, asi que se reinician al reiniciar el servidor.
