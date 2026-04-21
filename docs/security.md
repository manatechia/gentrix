# Seguridad de Gentrix

**Estado:** vivo, iterativo. Última actualización: 2026-04-21.

Este doc es la fuente única sobre cómo tratamos datos, autenticación,
autorización, logs y secretos en Gentrix. Cada vez que tomemos una decisión
de seguridad (aceptar un riesgo, diferir un control, elegir un mecanismo),
la dejamos acá — no en el chat de un ticket.

## Contexto y modelo de amenazas

Gentrix es una app multi-tenant para geriátricos. Maneja datos sensibles:
ficha clínica de residentes, VGI, órdenes de medicación, observaciones,
ejecuciones de dosis. Los usuarios son staff operativo (enfermería,
asistentes), dirección de salud y administración.

**Amenazas que tomamos en serio**

1. **Cross-tenant leakage (IDOR)**: un usuario del geriátrico A viendo o
   mutando datos del geriátrico B. Catastrófico y silencioso.
2. **Escalación horizontal de privilegios**: un asistente borrando datos que
   sólo gestión debería poder tocar.
3. **Credential stuffing / brute force** en login y reset de contraseñas.
4. **XSS → robo de sesión** por almacenar el token en `localStorage`.
5. **Data leakage en logs**: que un stack trace deje colar una password en
   claro, un Authorization header, una cookie de sesión.

**Amenazas conocidas pero diferidas** (ver "Decisiones y compromisos")

- XSS directo al DOM — React mitiga por default; no usamos
  `dangerouslySetInnerHTML` hoy.
- CSRF — no aplica mientras el token vaya en `Authorization: Bearer`; si
  migramos a cookie `httpOnly` hay que sumar double-submit o SameSite strict.
- Supply-chain de dependencias — por ahora dependemos de `pnpm audit` ad-hoc.

## Controles actuales

### Autenticación

- **Modelo**: session tokens opacos (UUID v4) persistidos en `auth_sessions`,
  validados por DB lookup en cada request vía `SessionGuard`.
  TTL: 12 horas. Revocación: borrar la fila.
- **Passwords**: hash con el módulo en `apps/backend/src/common/auth/password-hash.ts`
  + policy en `password-policy.ts`. Migración oportunista de legacy plaintext
  a hash en cada login (`verifyPassword().needsRehash`).
- **Forced password change**: `ForcePasswordChangeGuard` impide operar hasta
  cambiar el password inicial. Sólo `/api/auth/session`, `/api/auth/logout` y
  `/api/users/me/change-password` quedan habilitados (marcados con
  `@AllowDuringForcedChange()`).
- **Storage del token en el cliente**: `localStorage` (axios lo lee desde
  `shared/lib/auth-token-storage.ts`).
  **Riesgo aceptado a corto plazo**: un XSS puede leer el token. Mitigado
  parcialmente por CSP estricta en Vercel + ausencia de `dangerouslySetInnerHTML`.
  Plan: migrar a cookie `httpOnly + SameSite=Lax` en un PR separado.

### Autorización

- **Roles**: `admin`, `health-director`, `nurse`, `assistant`.
- **Políticas**: `apps/backend/src/common/auth/role-access.ts` centraliza
  `canXxx` / `assertCanXxx`.
- **Scoping multi-tenant**: cada servicio que recibe un id del path debe
  resolver por `organizationId` del `request.authSession.activeOrganization`.
  Sin esto, el path abre un IDOR.
- **Scoping por facility**: hoy es débil. Varios writes aceptan
  `organizationId` pero no `facilityId`. Listado en "Deuda pendiente".

**Matriz resumida** (ver cada controller para el detalle):

| Recurso | Crear/Editar | Eliminar | Ejecutar/Operativo |
|---|---|---|---|
| Residentes | admin, director | admin, director | — |
| Observaciones | nurse, assistant + mgmt | admin, director | — |
| Órdenes de medicación | admin, director | — | — |
| Ejecución de medicación | — | — | nurse, assistant + mgmt |
| Agenda (one-off y series) | nurse, assistant + mgmt | admin, director | — |
| Schedules de staff | admin, director | — | — |
| Usuarios / reset password | admin | — | — |

### Rate limiting

- **Global**: `@nestjs/throttler` en `AppModule`, 120 req/min por IP.
- **Login** (`POST /api/auth/login`): 10 req/min por IP.
- **Reset password admin** (`POST /api/users/:id/reset-password`): 20 req/min.
- **Cambio de password propio** (`POST /api/users/me/change-password`): 10 req/min.
- **Sink de errores** (`POST /api/client-errors`): 60 req/min (token bucket
  propio, anterior a throttler).
- `app.set('trust proxy', 1)` para que la IP real pase detrás de Render / Vercel.

### Security headers

- **Backend** (API): `helmet()` con defaults + `crossOriginResourcePolicy:
  cross-origin` (el front de Vercel consume datos). CSP se deja off acá
  porque la API no sirve HTML.
- **Frontend** (Vercel): `vercel.json` → `headers` con:
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`
  - `Content-Security-Policy` moderada:
    `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://gentrix-86yn.onrender.com; frame-ancestors 'none'`

### CORS

- `apps/backend/src/main.ts` → `resolveCorsOrigin()`.
- En dev (sin `CORS_ORIGIN` seteada) reflejamos cualquier origen para no
  pelear con `localhost:4200`, `host.docker.internal`, Vite proxies.
- En prod **se exige whitelist explícita** por env var (`CORS_ORIGIN`,
  lista separada por coma). Sin ella, no levantamos el origen.

### Logging y datos sensibles

- Ver `docs/tech-debt/` y el commit de logging para detalle. Resumen:
  - `pino` redacta `authorization`, `cookie`, `x-forwarded-for`, `set-cookie`.
  - Request bodies **no se loguean** automáticamente (sólo request line +
    status + responseTime).
  - `ApiExceptionFilter` filtra stack traces a mensajes amigables en prod.
  - Passwords en claro **nunca** tocan el logger — están sólo en DTOs que
    consume el service y nunca se stringifican.

### Secretos

- `.env.local` y `.env.example` en el repo (el `.local` ignorado via
  `.gitignore`).
- En Render, vars inyectadas desde el dashboard.
- En Vercel, vars desde el dashboard de cada env.
- `JWT_SECRET` **no existe** — no usamos JWT. Ver abajo.
- **Pending**: verificación periódica de que no se colaron secrets en
  commits pasados (`gitleaks` / `truffleHog`) — está en la lista.

## Decisiones y compromisos

### Por qué NO JWT hoy

Usamos session tokens opacos en DB, no JWT firmados. El único motivo fuerte
para migrar a JWT es performance (evitar el DB lookup por request) o
horizontal scaling stateless. Ninguno es un problema real con el volumen
actual en Render free. Con JWT perdemos revocación instantánea (hace falta
mantener blacklist, lo cual mata la ganancia de stateless). Lo revisitamos
si:

- Movemos el backend a múltiples instancias sin DB compartida de sessions, o
- El lookup de sesión pasa a ser un bottleneck medible (p99 > 50ms atribuible).

### Por qué NO RBAC framework (CASL / Oso)

Tenemos 4 roles y ~7 acciones distintas. Un framework formal agrega una
capa de abstracción (políticas, subjects, conditions) que todavía no paga.
Lo revisitamos al pasar las 20 políticas o al necesitar permisos "propios
del objeto" (ej. "el autor de una nota puede editarla").

### Por qué NO field-level encryption

Supabase ya encripta at-rest. La encriptación a nivel columna agrega complejidad
(gestión de keys, búsqueda, auditoría) que no paga sin una regulación que la
exija. A revisar cuando aparezca un requerimiento concreto (HIPAA / LPDP).

## Deuda pendiente

Ordenada por impacto:

1. **Migrar token de `localStorage` a cookie `httpOnly + SameSite=Lax`**.
   Requiere: cambio en axios (dejar de leer token, confiar en cookie), cambio
   en `SessionGuard` (leer cookie además del Bearer), CSRF double-submit,
   ajuste de CORS para `credentials: true`, actualización de Vercel rewrite
   para pasar cookies. Estimado: 1 día. Bloquea XSS → session theft.
2. **Facility scoping en mutaciones**. Hoy passamos `organizationId` a los
   writes pero no validamos que `facilityId` del recurso coincida con el
   `activeFacility` del caller. Bajo riesgo en una org con 1 facility,
   alto si crecemos a multi-facility por org.
3. **`pnpm audit` automatizado** + Dependabot o Renovate.
4. **Scan retroactivo de secrets** en la historia del repo con `gitleaks`.
5. **Logs de dominio faltantes**: altas/bajas explícitas (discharge),
   password-change exitoso por admin. Hoy se loguea lo importante pero hay
   huecos.
6. **2FA** para admin y health-director. Nice-to-have hasta que haya
   compromiso de cuenta real.

## Respuesta a incidentes (stub)

Si sospechamos compromiso:

1. Revocar sesiones activas del usuario: `DELETE FROM auth_sessions WHERE userId = …`.
2. Forzar reset: `UPDATE auth_users SET forcePasswordChange = true WHERE id = …`.
3. Buscar en logs de Render por `reqId`, `userId` o IP sospechosa.
4. Si es cross-tenant: export rápido de `audit_logs` filtrado por la
   ventana afectada.
5. Documentar en un incidente en este directorio.
