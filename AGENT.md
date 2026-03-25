# AGENT

## Proposito

Este archivo sirve para que otro agente no invente certezas.
Describe lo que hoy parece real, lo que no esta validado y lo que solo existe como direccion posible.

No usar este archivo como changelog.
Si cambia el estado real o cambia la prioridad de negocio, actualizarlo rapido.

## Estado actual

- Repo: monorepo Nx con `apps/frontend` y `apps/backend`.
- Frontend: React + Vite + Tailwind.
- Backend: hay codigo NestJS y Prisma versionado.
- Base local: hay `docker-compose.yml` y PostgreSQL local configurado.
- Foco inmediato: que la UI funcione bien.
- La direccion del producto puede cambiar rapido segun negocio.

## Confirmado

- La unica funcionalidad confirmada hoy es la creacion de pacientes.
- Hoy el sistema se comporta como si hubiera un solo usuario.
- En el codigo, el dominio aparece como `residents` / `residentes`. No asumir que esa terminologia ya este cerrada desde negocio.
- Existen en el repo rutas de frontend para login, dashboard y residentes.
- Existen en el repo modulos/backend/endpoints para `auth`, `residents`, `staff`, `medication` y `system`.
- Existen `schema.prisma`, migraciones y seeds.
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
- Persistencia y comportamiento del backend fuera del alta de pacientes.
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

- Prioridad: que la UI funcione bien en el flujo de creacion de pacientes.
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
- `pnpm check`
- `pnpm prisma:generate`
- `pnpm prisma:migrate:dev`
- `pnpm prisma:seed`
- `docker compose up --build`
