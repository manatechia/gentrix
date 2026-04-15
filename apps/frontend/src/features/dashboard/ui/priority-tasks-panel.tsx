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
  type TaskPriorityBucket,
} from '../lib/shift-time';

interface PriorityTasksPanelProps {
  occurrences: ResidentAgendaOccurrenceWithResident[];
  now: Date;
  /** id del contenedor para navegar desde el header con ancla. */
  anchorId: string;
}

interface TaskBucketConfig {
  id: Exclude<TaskPriorityBucket, 'past'>;
  title: string;
  helper: string;
  accentClassName: string;
  emptyMessage: string;
}

const BUCKETS: TaskBucketConfig[] = [
  {
    id: 'now',
    title: 'Ahora',
    helper: 'Entre los últimos 15 min y los próximos 30 min.',
    accentClassName:
      'border-l-4 border-l-[rgb(168,43,17)] bg-[rgba(168,43,17,0.05)]',
    emptyMessage: 'Nada urgente en este momento.',
  },
  {
    id: 'soon',
    title: 'Próximas 2 horas',
    helper: 'Para prepararse con tiempo.',
    accentClassName:
      'border-l-4 border-l-brand-primary bg-[rgba(0,102,132,0.04)]',
    emptyMessage: 'Sin tareas en las próximas 2 horas.',
  },
  {
    id: 'later',
    title: 'Más tarde',
    helper: 'El resto del día.',
    accentClassName:
      'border-l-4 border-l-[rgba(47,79,79,0.3)] bg-white/70',
    emptyMessage: 'Sin tareas más adelante.',
  },
];

const KIND_STYLES: Record<TaskKind, { chip: string; label: string }> = {
  medication: {
    chip: 'bg-[rgba(34,124,94,0.14)] text-[rgb(25,95,70)]',
    label: 'Medicación',
  },
  activity: {
    chip: 'bg-[rgba(0,102,132,0.14)] text-brand-primary',
    label: 'Actividad',
  },
  medical: {
    chip: 'bg-[rgba(212,140,18,0.18)] text-[rgb(150,90,10)]',
    label: 'Médico / traslado',
  },
  other: {
    chip: 'bg-[rgba(47,79,79,0.1)] text-brand-text-secondary',
    label: 'Tarea',
  },
};

export function PriorityTasksPanel({
  occurrences,
  now,
  anchorId,
}: PriorityTasksPanelProps) {
  const grouped: Record<
    Exclude<TaskPriorityBucket, 'past'>,
    ResidentAgendaOccurrenceWithResident[]
  > = { now: [], soon: [], later: [] };

  for (const occurrence of occurrences) {
    const bucket = classifyOccurrenceByTime(occurrence.scheduledAt, now);
    if (bucket === 'past') continue;
    grouped[bucket].push(occurrence);
  }

  for (const list of Object.values(grouped)) {
    list.sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );
  }

  const totalVisible = grouped.now.length + grouped.soon.length + grouped.later.length;

  return (
    <section
      id={anchorId}
      data-testid="priority-tasks-panel"
      className={`${surfaceCardClassName} grid gap-5 scroll-mt-6`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1">
          <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
            Tareas del turno
          </span>
          <p className="max-w-[60ch] leading-[1.55] text-brand-text-secondary">
            Ordenadas por cercanía al reloj. Hacé click en una para abrir la
            ficha del residente.
          </p>
        </div>
        <span
          className={`${badgeBaseClassName} bg-brand-primary/10 text-brand-primary`}
        >
          {totalVisible}
        </span>
      </header>

      <div className="grid gap-4">
        {BUCKETS.map((bucket) => {
          const items = grouped[bucket.id];
          return (
            <div
              key={bucket.id}
              data-testid={`priority-tasks-bucket-${bucket.id}`}
              className={`grid gap-2 rounded-[20px] px-4 py-3 ${bucket.accentClassName}`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-[1rem] font-semibold text-brand-text">
                  {bucket.title}
                </h3>
                <span className="text-[0.82rem] text-brand-text-secondary">
                  {bucket.helper}
                </span>
              </div>

              {items.length === 0 ? (
                <p className="text-[0.9rem] text-brand-text-secondary">
                  {bucket.emptyMessage}
                </p>
              ) : (
                <ul className="grid gap-2">
                  {items.map((occurrence) => {
                    const key = `${occurrence.sourceType}:${occurrence.sourceId}:${occurrence.occurrenceDate ?? 'one'}`;
                    const kind = inferTaskKind(occurrence.title);
                    const kindStyle = KIND_STYLES[kind];
                    return (
                      <li key={key}>
                        <Link
                          to={`/residentes/${occurrence.residentId}`}
                          data-testid={`priority-tasks-item-${key}`}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-[16px] border border-[rgba(0,102,132,0.1)] bg-white/95 px-3 py-2 transition hover:bg-brand-neutral/60"
                        >
                          <span className="flex items-center gap-3">
                            <span className="min-w-[48px] text-[0.95rem] font-semibold text-brand-primary">
                              {formatAgendaTime(occurrence.scheduledAt)}
                            </span>
                            <span
                              className={`${badgeBaseClassName} ${kindStyle.chip} min-h-7 px-2 text-[0.7rem]`}
                            >
                              {kindStyle.label}
                            </span>
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
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
