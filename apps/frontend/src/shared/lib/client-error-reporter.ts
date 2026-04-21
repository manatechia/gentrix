// Sink ligero para que los errores del frontend terminen en los logs del
// backend (Render) con el mismo reqId que correlaciona con la request que los
// originó. Ver docs/tech-debt si evaluamos Sentry en el futuro.

export type ClientErrorSeverity = 'warn' | 'error' | 'fatal';

export interface ReportClientErrorPayload {
  message: string;
  stack?: string;
  requestId?: string;
  severity?: ClientErrorSeverity;
  context?: Record<string, unknown>;
}

const ENDPOINT = '/api/client-errors';
const MAX_DEDUPE_ENTRIES = 50;
const seen = new Set<string>();

function dedupeKey(payload: ReportClientErrorPayload): string {
  // Tomamos las primeras líneas del stack para no considerar iguales errores
  // con stacks totalmente distintos.
  const stackHead = payload.stack?.split('\n').slice(0, 3).join('|') ?? '';
  return `${payload.severity ?? 'error'}|${payload.message}|${stackHead}`;
}

function rememberSeen(key: string): void {
  if (seen.size >= MAX_DEDUPE_ENTRIES) {
    const first = seen.values().next().value;
    if (first !== undefined) {
      seen.delete(first);
    }
  }
  seen.add(key);
}

export function reportClientError(payload: ReportClientErrorPayload): void {
  const key = dedupeKey(payload);
  if (seen.has(key)) {
    return;
  }
  rememberSeen(key);

  const body = {
    message: payload.message.slice(0, 2048),
    stack: payload.stack?.slice(0, 8192),
    requestId: payload.requestId,
    severity: payload.severity ?? 'error',
    url: typeof location !== 'undefined' ? location.href.slice(0, 256) : undefined,
    userAgent:
      typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 512) : undefined,
    context: payload.context,
  };

  if (import.meta.env.DEV) {
    // En dev no metemos ruido al backend: se ve en la consola.
    console.error('[client-error]', body);
    return;
  }

  try {
    void fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
      credentials: 'same-origin',
    }).catch(() => {
      // Fire-and-forget: si el sink cae, no queremos bloquear la app.
    });
  } catch {
    // Ignoramos cualquier fallo de red para no recursar en el reporter.
  }
}
