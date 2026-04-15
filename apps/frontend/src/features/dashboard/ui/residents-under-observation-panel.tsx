import { Link } from 'react-router-dom';

import type { ResidentOverview } from '@gentrix/shared-types';

import {
  badgeBaseClassName,
  surfaceCardClassName,
} from '../../../shared/ui/class-names';

interface ResidentsUnderObservationPanelProps {
  residents: ResidentOverview[];
}

const relativeFormatter = new Intl.RelativeTimeFormat('es-AR', {
  numeric: 'auto',
});

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: 'short',
});

function formatSinceLabel(changedAt: string): string {
  const changed = new Date(changedAt).getTime();
  const now = Date.now();
  const diffMinutes = Math.round((changed - now) / (60 * 1000));
  const absMin = Math.abs(diffMinutes);

  if (absMin < 60) return relativeFormatter.format(diffMinutes, 'minute');
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return relativeFormatter.format(diffHours, 'hour');
  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 7) return relativeFormatter.format(diffDays, 'day');
  return dateFormatter.format(new Date(changedAt));
}

/**
 * Widget del dashboard. Lista a los residentes que actualmente están en
 * observación dentro de la organización activa. Cada item linkea al perfil
 * del residente, donde el operador puede quitarlo de observación.
 *
 * La data se filtra del snapshot del dashboard, así que respeta los mismos
 * límites de visibilidad por organización/instalación que el resto de los
 * widgets — no requiere request adicional.
 */
export function ResidentsUnderObservationPanel({
  residents,
}: ResidentsUnderObservationPanelProps) {
  const underObservation = residents.filter(
    (resident) => resident.careStatus === 'en_observacion',
  );

  if (underObservation.length === 0) {
    return (
      <section
        data-testid="residents-under-observation-panel"
        className={`${surfaceCardClassName} flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4`}
      >
        <span className="flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[rgb(25,95,70)] sm:text-[0.76rem] sm:tracking-[0.16em]">
          <span
            className="inline-block h-2 w-2 rounded-full bg-[rgb(25,95,70)]"
            aria-hidden="true"
          />
          En observación
          <span className="ml-1 font-normal normal-case tracking-normal text-brand-text-secondary">
            · sin novedades
          </span>
        </span>
        <span
          className={`${badgeBaseClassName} bg-[rgba(34,124,94,0.14)] text-[rgb(25,95,70)]`}
        >
          0
        </span>
      </section>
    );
  }

  return (
    <section
      className={`${surfaceCardClassName} grid gap-3 sm:gap-4`}
      data-testid="residents-under-observation-panel"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1">
          <span className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-brand-primary sm:text-[0.76rem] sm:tracking-[0.16em]">
            En observación
          </span>
          <p className="hidden max-w-[60ch] text-[0.86rem] leading-[1.45] text-brand-text-secondary sm:block sm:text-base sm:leading-[1.55]">
            Residentes que requieren atención reforzada del equipo. Hacé click
            para abrir la ficha y registrar seguimiento o quitarlos del estado.
          </p>
        </div>
        <span
          className={`${badgeBaseClassName} bg-[rgba(212,140,18,0.16)] text-[rgb(150,90,10)]`}
        >
          {underObservation.length}
        </span>
      </div>

      <ul className="grid gap-2.5">
        {underObservation.map((resident) => (
            <li key={resident.id}>
              <Link
                to={`/residentes/${resident.id}`}
                data-testid={`residents-under-observation-item-${resident.id}`}
                className="flex items-center justify-between gap-3 rounded-[20px] border border-[rgba(0,102,132,0.12)] bg-white/85 px-4 py-3 transition hover:bg-brand-neutral/60"
              >
                <span className="grid gap-1">
                  <strong className="text-brand-text">
                    {resident.fullName}
                  </strong>
                  <span className="text-[0.86rem] text-brand-text-secondary">
                    Habitación {resident.room}
                    {resident.careStatusChangedAt && (
                      <>
                        {' · '}
                        <span data-testid={`residents-under-observation-since-${resident.id}`}>
                          en observación {formatSinceLabel(resident.careStatusChangedAt)}
                        </span>
                      </>
                    )}
                    {resident.careStatusChangedBy && (
                      <>
                        {' · '}
                        <span className="text-brand-text-muted">
                          por {resident.careStatusChangedBy}
                        </span>
                      </>
                    )}
                  </span>
                </span>
                <span className="text-[0.86rem] font-semibold text-brand-primary">
                  Ver ficha
                </span>
              </Link>
            </li>
          ))}
      </ul>
    </section>
  );
}
