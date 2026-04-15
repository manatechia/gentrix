import { Link } from 'react-router-dom';

import type { ResidentAgendaOccurrenceWithResident } from '@gentrix/shared-types';

import {
  badgeBaseClassName,
  surfaceCardClassName,
} from '../../../shared/ui/class-names';
import { formatAgendaTime } from '../../residents/lib/resident-agenda-utils';
import {
  classifyOccurrenceByTime,
  inferTaskKind,
  type TaskKind,
} from '../lib/shift-time';

interface CriticalTasksPanelProps {
  occurrences: ResidentAgendaOccurrenceWithResident[];
  now: Date;
}

const KIND_LABEL: Record<TaskKind, string> = {
  medication: 'Medicación',
  medical: 'Médico / traslado',
  activity: 'Actividad',
  other: 'Tarea',
};

const KIND_CHIP: Record<TaskKind, string> = {
  medication: 'bg-[rgba(34,124,94,0.14)] text-[rgb(25,95,70)]',
  medical: 'bg-[rgba(212,140,18,0.18)] text-[rgb(150,90,10)]',
  activity: 'bg-[rgba(0,102,132,0.14)] text-brand-primary',
  other: 'bg-[rgba(47,79,79,0.1)] text-brand-text-secondary',
};

/**
 * Vista admin-centrada: muestra solo lo que potencialmente requiere
 * intervención: tareas vencidas + próximas medicaciones y traslados médicos
 * dentro de las próximas 3 horas. Ignora actividades comunes y cosas más
 * lejanas en el día.
 */
export function CriticalTasksPanel({
  occurrences,
  now,
}: CriticalTasksPanelProps) {
  const critical = occurrences
    .map((occurrence) => ({
      occurrence,
      kind: inferTaskKind(occurrence.title),
      bucket: classifyOccurrenceByTime(occurrence.scheduledAt, now),
    }))
    .filter(({ bucket, kind }) => {
      // Vencidas: todas, independientemente del tipo.
      if (bucket === 'past') return true;
      // Próximas (≤ 2h): solo medicación o médico/traslado.
      if (bucket === 'now' || bucket === 'soon') {
        return kind === 'medication' || kind === 'medical';
      }
      return false;
    })
    .sort(
      (a, b) =>
        new Date(a.occurrence.scheduledAt).getTime() -
        new Date(b.occurrence.scheduledAt).getTime(),
    );

  if (critical.length === 0) {
    return (
      <section
        data-testid="critical-tasks-panel"
        className={`${surfaceCardClassName} flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4`}
      >
        <span className="flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[rgb(25,95,70)] sm:text-[0.76rem] sm:tracking-[0.16em]">
          <span
            className="inline-block h-2 w-2 rounded-full bg-[rgb(25,95,70)]"
            aria-hidden="true"
          />
          Tareas críticas
          <span className="ml-1 font-normal normal-case tracking-normal text-brand-text-secondary">
            · todo al día
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
      data-testid="critical-tasks-panel"
      className={`${surfaceCardClassName} grid gap-3 sm:gap-4`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1">
          <span className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-brand-primary sm:text-[0.76rem] sm:tracking-[0.16em]">
            Tareas críticas
          </span>
          <p className="hidden max-w-[60ch] text-[0.86rem] leading-[1.45] text-brand-text-secondary sm:block sm:text-base sm:leading-[1.55]">
            Vencidas + medicaciones y traslados médicos en las próximas 2 horas.
          </p>
        </div>
        <span
          className={`${badgeBaseClassName} bg-[rgba(168,43,17,0.12)] text-[rgb(130,44,25)]`}
        >
          {critical.length}
        </span>
      </header>

      <ul className="grid gap-2">
          {critical.map(({ occurrence, kind, bucket }) => {
            const key = `${occurrence.sourceType}:${occurrence.sourceId}:${occurrence.occurrenceDate ?? 'one'}`;
            const isOverdue = bucket === 'past';
            return (
              <li key={key}>
                <Link
                  to={`/residentes/${occurrence.residentId}`}
                  data-testid={`critical-tasks-item-${key}`}
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-[16px] border px-3 py-2 transition hover:bg-brand-neutral/60 ${
                    isOverdue
                      ? 'border-[rgba(168,43,17,0.25)] bg-[rgba(168,43,17,0.04)]'
                      : 'border-[rgba(0,102,132,0.12)] bg-white/95'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`min-w-[48px] text-[0.95rem] font-semibold ${isOverdue ? 'text-[rgb(130,44,25)]' : 'text-brand-primary'}`}
                    >
                      {formatAgendaTime(occurrence.scheduledAt)}
                    </span>
                    <span
                      className={`${badgeBaseClassName} ${KIND_CHIP[kind]} min-h-7 px-2 text-[0.7rem]`}
                    >
                      {KIND_LABEL[kind]}
                    </span>
                    {isOverdue && (
                      <span
                        className={`${badgeBaseClassName} bg-[rgba(168,43,17,0.14)] text-[rgb(130,44,25)] min-h-7 px-2 text-[0.7rem]`}
                      >
                        Vencida
                      </span>
                    )}
                    <span className="grid">
                      <strong className="text-[0.95rem] text-brand-text">
                        {occurrence.title}
                      </strong>
                      <span className="text-[0.82rem] text-brand-text-secondary">
                        {occurrence.residentFullName} · Hab.{' '}
                        {occurrence.residentRoom}
                      </span>
                    </span>
                  </span>
                  <span className="text-[0.82rem] font-semibold text-brand-primary">
                    Ver ficha →
                  </span>
                </Link>
              </li>
            );
          })}
      </ul>
    </section>
  );
}
