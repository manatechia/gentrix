# Reinicio de contraseña desde el panel de administrador

Documento de propuesta que acompaña la implementación del flujo completo
(schema, backend, frontend, auditoría, tests).

## 1. Modelo de datos y base de datos

**Cambios en `UserAccount` (tabla `User`)**

- `forcePasswordChange BOOLEAN NOT NULL DEFAULT false` — marca al usuario
  como obligado a cambiar su contraseña en el próximo acceso.
- `passwordChangedAt TIMESTAMP NULL` — se setea cuando el usuario completa
  el cambio forzado. Al resetear desde admin queda en `NULL` otra vez para
  que no haya confusión entre "contraseña temporal" y "contraseña elegida
  por el usuario".
- Los usuarios existentes se marcan con `passwordChangedAt = createdAt`
  para no forzarles un cambio retroactivo.

**Nueva tabla `PasswordResetAudit`**

| Columna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `organizationId` | UUID | Organización del target. |
| `adminUserId` | UUID NULL | Quién disparó el reset (null para cambios forzados completados por el propio usuario). |
| `targetUserId` | UUID | Usuario afectado. |
| `action` | TEXT | `admin-reset`, `forced-change-completed`, `forced-change-failed`. |
| `result` | TEXT | `success`, `failure`. |
| `reason` | TEXT NULL | Detalle del failure: `confirmation-mismatch`, `policy-violation`, `invalid-current-password`, `same-as-current`. |
| `occurredAt` | TIMESTAMP | |
| `ipAddress` / `userAgent` | TEXT NULL | Contexto de red. |

Índices por `(organizationId, occurredAt)`, `(targetUserId, occurredAt)`,
`(adminUserId, occurredAt)` para reporting y forense.

Migración: `apps/backend/prisma/migrations/20260415120000_add_password_reset_flow/migration.sql`.

## 2. Backend (NestJS)

**Guardia `ForcePasswordChangeGuard`** — guard global que bloquea cualquier
endpoint autenticado cuando el usuario tiene `forcePasswordChange = true`,
con una whitelist vía `@AllowDuringForcedChange()`:

- `GET /api/auth/session`
- `POST /api/auth/logout`
- `POST /api/users/me/change-password`

Esto significa que aun si el frontend falla la redirección, el API
rechaza el resto de las rutas con `403`.

**Endpoints nuevos**

- `POST /api/users/:userId/reset-password` (rol `admin`)
  - Genera una contraseña temporal válida contra la política.
  - Setea `forcePasswordChange = true`, limpia `passwordChangedAt`.
  - Audita con `action = 'admin-reset'`, `result = 'success'`.
  - Retorna `{ userId, temporaryPassword, resetAt }` — se muestra una sola
    vez en el panel.
  - Rechaza: propia cuenta, otros administradores, usuarios fuera de la
    organización activa.
- `POST /api/users/me/change-password` (cualquier sesión)
  - Validaciones encadenadas: coincidencia de confirmación → política →
    contraseña actual correcta → distinta de la actual.
  - Audita cada fallo (`action = 'forced-change-failed'` con `reason`) y
    el éxito (`forced-change-completed`).
  - Al éxito: actualiza password, limpia flag, setea `passwordChangedAt`.

**Política de contraseña** (`common/auth/password-policy.ts`)

- Mínimo 8 caracteres.
- Al menos una minúscula, una mayúscula, un dígito y un carácter especial
  (`!@#$%^&*()-_=+[]{};:'",.<>/?\|` + backtick + tilde).
- `generateTemporaryPassword()` — siempre emite una contraseña que cumple
  todas las reglas (usada en el reset admin).

**Creación de usuarios**

`PrismaUserRepository.create()` ahora setea `forcePasswordChange = true`
para todo alta nueva. El password inicial que carga el admin se valida
contra la misma política.

**Sesiones**

- `AuthUser` en `@gentrix/shared-types` expone `forcePasswordChange`.
- `AuthSession` (login + GET session) siempre trae el valor actual leído
  del registro `UserAccount`, así un cambio exitoso se refleja en la
  siguiente request sin reiniciar sesión.

## 3. Frontend (React)

- `AuthSessionContext` expone `refreshSession()` para rehidratar la
  sesión después del cambio y limpiar el flag.
- `ForcePasswordGate` envuelve todas las rutas autenticadas y redirige a
  `/cambiar-contrasena` cuando el flag está activo. `RootRedirect` y
  `LoginRoute` aplican la misma lógica para los atajos de URL.
- `ForcePasswordChangeScreen` — formulario con:
  - contraseña actual (obligatoria),
  - nueva contraseña,
  - confirmación,
  - checklist en vivo que marca cada regla de la política al tipear,
  - botón "Cerrar sesión" como escape.
- Panel admin (`UsersAdminWorkspace`):
  - Badge "Pendiente de cambio de contraseña" en cada usuario con la
    marca activa.
  - Botón "Reiniciar contraseña" por fila → modal de confirmación →
    modal que muestra la contraseña temporal una única vez, con botón
    "Copiar".

## 4. Auditoría

Cada evento relevante deja traza en `PasswordResetAudit`:

| Acción | adminUserId | Resultado | Reason |
|---|---|---|---|
| Admin resetea | ID del admin | `success` | — |
| Usuario completa el cambio forzado | null | `success` | — |
| Confirmación distinta | null | `failure` | `confirmation-mismatch` |
| Política no cumplida | null | `failure` | `policy-violation` |
| Contraseña actual incorrecta | null | `failure` | `invalid-current-password` |
| Nueva = actual | null | `failure` | `same-as-current` |

Todos incluyen `occurredAt`, `ipAddress` y `userAgent` cuando la request
los provee.

## 5. Validaciones y casos borde cubiertos

- Self-reset desde panel → `400 Bad Request`.
- Reset de otro admin desde panel → `400 Bad Request`.
- Usuario fuera de la organización activa → `404 Not Found`.
- Password policy falla en cualquier escenario → `400` con detalle por
  regla incumplida.
- Contraseña actual incorrecta → `401 Unauthorized`, se audita la falla.
- Nueva contraseña igual a la actual → `400`, se audita.
- Intento de navegar a cualquier otra ruta con `forcePasswordChange=true`:
  - frontend: `ForcePasswordGate` redirige a `/cambiar-contrasena`.
  - backend: `ForcePasswordChangeGuard` devuelve `403 Forbidden`.
- La contraseña temporal se muestra una única vez al admin que dispara el
  reset (requerida por no persistir en texto plano más allá de `User.password`;
  ver próximos pasos recomendados).
- Tokens de sesión previos siguen siendo válidos (el guard los bloquea
  contra el resto del API igualmente).

## 6. Hashing de contraseñas

Las contraseñas se almacenan con `scrypt` (Node core, sin dependencias
nativas) en el formato `scrypt$saltHex$hashHex`. La util está en
`apps/backend/src/common/auth/password-hash.ts`.

- `hashPassword(plain)` — genera sal aleatoria de 16 bytes y una clave
  derivada de 64 bytes.
- `verifyPassword(plain, stored)` — compara con `timingSafeEqual` y detecta
  rows "legacy" (texto plano sin el prefijo `scrypt$`). Retorna
  `{ matches, needsRehash }` para que el caller decida si migrar.
- `AuthService.login` reemplaza la comparación `===` por `verifyPassword`
  y re-hashea de manera oportunista cuando detecta un row legacy
  (`updatePasswordHash` en el repo de auth-user). Un login exitoso
  migra el dato al nuevo formato de manera transparente.
- `UsersService.createUser`, `resetPassword` y `completeForcedChange`
  persisten siempre el hash. La contraseña temporal se hashea antes de
  tocar la BD; al admin se le muestra en texto una única vez.
- `completeForcedChange` usa `verifyPassword` tanto para validar la
  actual como para rechazar "nueva igual a la actual", sin importar si
  el row está en formato legacy o hasheado.
- Seed (`apps/backend/prisma/seed.mjs`) y seed in-memory
  (`InMemoryAuthUserRepository`) hashean los usuarios demo al crear/cargar.

No hace falta una migración one-off de datos: cualquier row plaintext
existente sigue funcionando y se migra al próximo login/reset/cambio.

## 7. Próximos pasos recomendados

- **Invalidación proactiva de sesiones tras un reset admin**: hoy el
  guard bloquea navegación, pero podría además marcar todas las
  `AuthSession` del target como `deletedAt = now`. Trivial sobre el
  repositorio de sesiones existente.
- **Rate-limit** del endpoint `POST /api/auth/login` y
  `POST /api/users/me/change-password` para mitigar fuerza bruta.
- **Token de reset por link en vez de password temporal** en una segunda
  iteración (mail con token firmado expirable en `password_reset_token`,
  `password_reset_token_expires_at`).

## 8. Tests

**Unitarios**

- `common/auth/password-policy.spec.ts` — 5 tests cubriendo reglas
  individuales y generación de temporarias.
- `common/auth/password-hash.spec.ts` — 5 tests de la util de hash
  (roundtrip, salt distinto por ejecución, rechazo de plaintext
  incorrecto, soporte de rows legacy, rechazo seguro de datos malformados).
- `modules/users/application/users.service.spec.ts` — 9 tests para
  `resetPassword` (happy path + casos borde) y `completeForcedChange`
  (confirmación, política, actual incorrecta, misma que anterior,
  happy path con limpieza del flag y auditoría).

**Integración / e2e (pendiente de extender)**

- Test end-to-end del flujo login → detectar flag → cambio de
  contraseña → acceso normal. Sugerido en `apps/frontend-e2e`
  reutilizando el fixture `gentrix-demo`.
- Test de integración NestJS (`supertest`) para los dos endpoints nuevos
  cubriendo el contrato de autorización.

El suite actual (`npx vitest run`) pasa 43/43 tests.
