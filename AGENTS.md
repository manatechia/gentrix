# AGENTS

## Proposito

Este archivo sirve para que otro agente no invente certezas.
Describe lo que hoy parece real, lo que no esta validado y lo que solo existe como direccion posible.

No usar este archivo como changelog.
Si cambia el estado real o cambia la prioridad de negocio, actualizarlo rapido.

## Estado actual

- Repo: monorepo Nx con `apps/frontend` y `apps/backend`.
- Frontend: React + Vite + Tailwind.
- Backend: NestJS modular con Prisma versionado y persistencia activa.
- Base local: hay `docker-compose.yml` y PostgreSQL local configurado.
- Foco inmediato: que la UI funcione bien.
- La direccion del producto puede cambiar rapido segun negocio.

## Confirmado

- La unica funcionalidad confirmada hoy como prioridad de producto sigue siendo el flujo de pacientes/residentes.
- Hoy el sistema se comporta como si hubiera un solo usuario.
- En el codigo, el dominio aparece como `residents` / `residentes`. No asumir que esa terminologia ya este cerrada desde negocio.
- Existen en el repo rutas de frontend para login, dashboard, residentes, personal y medicacion.
- Existen en el repo modulos/backend/endpoints para `auth`, `residents`, `clinical-history`, `staff`, `schedules`, `medication` y `system`.
- Existen `schema.prisma`, migraciones y seeds.
- Residentes, medicacion, staff y schedules ya persisten en PostgreSQL via Prisma.
- La historia clinica ya se carga como timeline append-only desde la ficha del residente.
- Auth y sesion siguen siendo demo/simple y viven en memoria.
- Que algo exista en codigo no lo convierte en funcionalidad validada.
- Norte confirmado para la siguiente etapa:
  - tenant por `Organization`
  - multiples residencias por organizacion
  - nombre tecnico preferido para residencia: `Facility`
  - personal con alcance organizacional y posible asignacion a varias residencias
  - necesidad de dejar abierta la puerta a identidad global de paciente
  - acceso futuro para familiares con permisos y pagos

## No validado

- Login, sesion y logout como flujo confiable de producto.
- Dashboard como pantalla estable.
- Staff, medication y alerts como funcionalidades reales.
- Persistencia y comportamiento del backend fuera del flujo de residentes.
- Que la arquitectura actual del backend este bien resuelta.
- Que los contratos actuales de frontend y backend reflejen lo que negocio va a necesitar en poco tiempo.

## Hipotesis

- Que `residents` sea el nombre correcto del agregado principal.
- Que NestJS + Prisma + PostgreSQL sigan siendo el camino operativo del backend.
- Que la estructura actual del frontend por features sea suficiente sin reordenarse.
- Que el dashboard vaya a seguir siendo la shell principal del producto.
- Que lo visible hoy en UI marque el orden real de prioridades de negocio.

## Direccion futura

- Existe una direccion validada para la siguiente etapa:
  - multi-tenant por organizacion
  - multiples residencias por organizacion
  - RBAC por membership y alcance
  - familiares como actores con permisos explicitos
  - compatibilidad futura con FHIR
- Esa direccion no es estado actual del codigo.
- Los detalles finos de migracion, permisos y deduplicacion de personas siguen abiertos.
- La direccion futura puede cambiar si negocio cambia la prioridad, pero ya no debe asumirse modelo single-tenant como norte.

## Riesgos de interpretacion

- Confundir codigo existente con funcionalidad confirmada.
- Confundir pantallas o rutas presentes con producto validado.
- Confundir `residents` en el repo con una definicion de negocio ya cerrada.
- Describir el backend con mas certeza de la que hoy merece.
- Congelar decisiones de arquitectura solo porque ya hay carpetas, modulos o schema.

## Trabajo inmediato

- Prioridad: que la UI funcione bien en el flujo de residentes (`listado -> alta -> ficha -> edicion`) y su historia clinica.
- Si tocas backend, hacerlo como soporte del flujo validado, no como apuesta arquitectonica grande.
- Si una decision no esta validada, tratarla como provisional.
- Antes de expandir alcance, verificar si negocio realmente lo necesita ahora.

## Mapa minimo del repo

- `apps/frontend`
- `apps/backend`
- `apps/backend/prisma`
- `libs/shared/types`
- `libs/shared/utils`
- `libs/domain/residents`
- `libs/domain/staff`
- `libs/domain/medication`

## Comandos utiles

- `pnpm serve:frontend`
- `pnpm serve:backend`
- `pnpm lint`
- `pnpm check`
- `pnpm prisma:generate`
- `pnpm prisma:migrate:dev`
- `pnpm prisma:seed`
- `docker compose up --build`

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## Guia de trabajo con Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

### Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

### When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

## E2E Testing Rules

- Use Playwright for all browser E2E tests.
- Prefer getByTestId() selectors.
- Never use arbitrary waits like waitForTimeout unless explicitly justified.
- Reuse authenticated storage state when possible.
- Seed data through API/helpers, not manual UI setup.
- For failures, inspect Playwright traces before editing tests.
- Keep E2E focused on critical user flows only.
