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
- `POST /api/residents`: alta de residentes persistida en memoria.
- `GET /api/staff`: personal resumido.
- `GET /api/medications`: medicacion resumida.

## Credenciales Demo

- `admin@gentrix.local`
- `gentrix123`

## Base De Datos

- Copiar `.env.example` a `.env` y ajustar `DATABASE_URL` segun el entorno local.
- La estructura PostgreSQL ya esta versionada en `prisma.config.ts`, `apps/backend/prisma/schema.prisma` y `apps/backend/prisma/migrations`.
- Los seeds iniciales cargan usuarios, residentes, medicacion, eventos clinicos y horarios.
- La API todavia corre con repositorios in-memory mientras terminamos la capa Prisma en runtime.
- Por eso Prisma queda versionado y listo para migraciones/seeds, pero no se inicializa en el arranque actual del backend.

## Nota De Desarrollo

El frontend usa proxy de Vite para redirigir `/api/*` al backend local en desarrollo.
Las sesiones actuales viven en memoria del backend, asi que se reinician al reiniciar el servidor.
