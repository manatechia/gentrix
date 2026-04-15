import { Link } from 'react-router-dom';

import type { ResidentAgendaEventWithResident } from '@gentrix/shared-types';

import {
  badgeBaseClassName,
  surfaceCardClassName,
} from '../../../shared/ui/class-names';
import { formatAgendaDateTime } from '../../residents/lib/resident-agenda-utils';

interface UpcomingAgendaPanelProps {
  events: ResidentAgendaEventWithResident[];
}

/**
 * Widget "Próximas tareas" del dashboard (SDD RF-05). Lista los eventos de
 * agenda futuros de toda la organización activa ordenados cronológicamente
 * para que enfermeras/asistentes sepan qué sigue. Cada fila linkea a la ficha
 * del residente, donde se puede editar o eliminar la actividad.
 */
export function UpcomingAgendaPanel({ events }: UpcomingAgendaPanelProps) {
  return (
    <section
      className={`${surfaceCardClassName} grid gap-4`}
      data-testid="upcoming-agenda-panel"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1">
          <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
            Proximas tareas
          </span>
          <p className="max-w-[60ch] leading-[1.55] text-brand-text-secondary">
            Agenda operativa del equipo: medicaciones, turnos y actividades
            proximas de los residentes.
          </p>
        </div>
        <span
          className={`${badgeBaseClassName} bg-brand-primary/10 text-brand-primary`}
        >
          {events.length}
        </span>
      </div>

      {events.length === 0 ? (
        <article className="rounded-[22px] border border-dashed border-[rgba(0,102,132,0.22)] bg-white/70 px-4 py-4 text-brand-text-secondary">
          No hay tareas proximas agendadas.
        </article>
      ) : (
        <ul className="grid gap-2.5">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                to={`/residentes/${event.residentId}`}
                data-testid={`upcoming-agenda-item-${event.id}`}
                className="flex items-center justify-between gap-3 rounded-[20px] border border-[rgba(0,102,132,0.12)] bg-white/85 px-4 py-3 transition hover:bg-brand-neutral/60"
              >
                <span className="grid gap-1">
                  <strong className="text-brand-text">{event.title}</strong>
                  <span className="text-[0.86rem] text-brand-text-secondary">
                    {event.residentFullName} — Habitacion {event.residentRoom}
                  </span>
                </span>
                <span className="text-[0.86rem] font-semibold text-brand-primary">
                  {formatAgendaDateTime(event.scheduledAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
