import type { AuthRole } from '@gentrix/shared-types';

/**
 * Variantes visuales del dashboard según el rol del usuario.
 *
 * - `operational`: asistente y enfermera. Prioriza acciones rápidas y
 *   lo que necesitan mirar durante el turno (agenda + observación).
 * - `management`: admin (y roles periféricos por ahora: health-director,
 *   external). Prioriza el estado global del geriátrico: ocupación,
 *   alertas, staff y medicación.
 */
export type DashboardVariant = 'operational' | 'management';

export function getDashboardVariant(role: AuthRole): DashboardVariant {
  if (role === 'assistant' || role === 'nurse') {
    return 'operational';
  }
  return 'management';
}
