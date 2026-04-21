import type { PinoLogger } from 'nestjs-pino';

/**
 * Stub silencioso de PinoLogger para tests unitarios donde los services se
 * instancian con `new` (sin pasar por el DI de Nest). No verifica llamadas —
 * si un test necesita assertar logs, usar `vi.fn()` en su lugar.
 */
export function silentPinoLogger(): PinoLogger {
  const noop = () => undefined;
  return {
    trace: noop,
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
    fatal: noop,
    setContext: noop,
    assign: noop,
    logger: undefined,
  } as unknown as PinoLogger;
}
