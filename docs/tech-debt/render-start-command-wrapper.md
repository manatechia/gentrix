# Deuda técnica: wrapper `scripts/run-backend.cjs` como workaround del dashboard de Render

**Estado:** abierta
**Origen:** 2026-04-21, tras deploys fallando con `Out of memory (used over 512Mi)` en Render.
**Alcance estimado:** 1 archivo (~37 líneas) + 1 línea en `package.json`.

## Contexto

El servicio `gentrix` en Render (`srv-d7gi20tckfvc73e6or00`) tiene dos fuentes de
configuración desalineadas:

- **`render.yaml` en el repo**: declara el `startCommand` correcto
  (`node dist/apps/backend/main.js`) apuntando al bundle precompilado.
- **Dashboard de Render**: tiene `startCommand = pnpm serve:backend`, porque el
  servicio no está linkeado como Blueprint — se creó como Web Service "manual"
  y `render.yaml` se ignora.

Con `pnpm serve:backend = nx serve backend` (modo dev con `prisma-generate` +
esbuild + watch), el startup excede los 512 MiB del plan free y Render mata el
contenedor.

Para no tocar el dashboard, restauramos [`scripts/run-backend.cjs`](../../scripts/run-backend.cjs)
(que el commit [c88c78b](https://github.com/manatechia/gentrix/commit/c88c78b)
había borrado como "AI cruft") y apuntamos `serve:backend` a ese wrapper. El
wrapper se ramifica por `NODE_ENV` / `RENDER`:

- en prod → `node dist/apps/backend/main.js`
- en local → `nx serve backend`

## Por qué es deuda

El wrapper existe **solo** porque el dashboard de Render está desalineado con
`render.yaml`. Ese mismo alias (`serve:backend`) intenta hacer dos cosas
distintas. Es una indirección para evitar configurar bien la infra.

## Opciones para resolverlo (elegir una)

Ordenadas de menor a mayor cambio de infra:

1. **Cambiar el `startCommand` en el dashboard de Render** a
   `node dist/apps/backend/main.js` y borrar el wrapper. Un click en el UI,
   sin código que mantener. `render.yaml` sigue siendo documentación.

2. **Split de npm scripts**: dejar `serve:backend` solo para dev
   (`nx serve backend`) y agregar `start:backend` →
   `node dist/apps/backend/main.js`. Cambiar el dashboard a
   `pnpm start:backend`. Más explícito que el wrapper, sin detección por env.

3. **Aplicar `render.yaml` como Blueprint**: conectar el servicio como Blueprint
   para que la config sea declarativa y viva en el repo. Deshabilita el override
   del dashboard. Cambios futuros de infra pasan por PR.

La opción 3 es la más limpia a largo plazo; la 1 es la más rápida.

## Por qué no se resolvió ahora

El fix urgente era restaurar los deploys. Tocar el dashboard o reconectar el
Blueprint requería una acción manual en el UI de Render; restaurar el wrapper
era puramente código y auto-deploy.

## Cuándo abordarlo

- Antes de mover a un plan pago / otro servicio: aprovechar para re-linkear
  como Blueprint.
- Si alguien se confunde con el doble significado de `serve:backend`.
- Si se agregan más servicios en Render y la config empieza a divergir más.
