import { Link } from 'react-router-dom';

import type { ResidentAgendaOccurrenceWithResident } from '@gentrix/shared-types';

import {
  badgeBaseClassName,
  surfaceCardClassName,
} from '../../../shared/ui/class-names';
import {
  formatAgendaRecurrenceBadge,
  formatAgendaTime,
} from '../../residents/lib/resident-agenda-utils';

interface UpcomingAgendaPanelProps {
  occurrences: ResidentAgendaOccurrenceWithResident[];
}

/**
 * Widget "Próximas tareas" del dashboard. Lista las ocurrencias del día
 * (eventos one-off + ocurrencias de series recurrentes) de toda la
 * organización, ordenadas cronológicamente. Cada fila linkea a la ficha
 * del residente para que la enfermera/asistente pueda editar o saltear
 * la ocurrencia.
 */
export function UpcomingAgendaPanel({ occurrences }: UpcomingAgendaPanelProps) {
  return (
    <section
      className={`${surfaceCardClassName} grid gap-4`}
      data-testid="upcoming-agenda-panel"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1">
          <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
            Próximas tareas
          </span>
          <p className="max-w-[60ch] leading-[1.55] text-brand-text-secondary">
            Agenda operativa del día: medicaciones, turnos y actividades de
            todos los residentes.
          </p>
        </div>
        <span
          className={`${badgeBaseClassName} bg-brand-primary/10 text-brand-primary`}
        >
          {occurrences.length}
        </span>
      </div>

      {occurrences.length === 0 ? (
        <article className="rounded-[22px] border border-dashed border-[rgba(0,102,132,0.22)] bg-white/70 px-4 py-4 text-brand-text-secondary">
          No hay tareas para hoy.
        </article>
      ) : (
        <ul className="grid gap-2.5">
          {occurrences.map((occurrence) => {
            const key = `${occurrence.sourceType}:${occurrence.sourceId}:${occurrence.occurrenceDate ?? 'one'}`;
            const recurrenceLabel =
              occurrence.sourceType === 'series'
                ? formatAgendaRecurrenceBadge(occurrence.recurrence)
                : null;
            return (
              <li key={key}>
                <Link
                  to={`/residentes/${occurrence.residentId}`}
                  data-testid={`upcoming-agenda-item-${key}`}
                  className="flex items-center justify-between gap-3 rounded-[20px] border border-[rgba(0,102,132,0.12)] bg-white/85 px-4 py-3 transition hover:bg-brand-neutral/60"
                >
                  <span className="grid gap-1">
                    <strong className="text-brand-text">{occurrence.title}</strong>
                    <span className="text-[0.86rem] text-brand-text-secondary">
                      {occurrence.residentFullName} — Habitación{' '}
                      {occurrence.residentRoom}
                      {recurrenceLabel && (
                        <span className="ml-2 rounded-full bg-brand-primary/10 px-2 py-0.5 text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-brand-primary">
                          {recurrenceLabel}
                        </span>
                      )}
                      {occurrence.isOverride && (
                        <span className="ml-2 rounded-full bg-[rgba(212,140,18,0.16)] px-2 py-0.5 text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-[rgb(150,90,10)]">
                          solo hoy
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="text-[0.86rem] font-semibold text-brand-primary">
                    {formatAgendaTime(occurrence.scheduledAt)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
