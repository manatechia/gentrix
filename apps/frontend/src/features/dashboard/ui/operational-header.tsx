import {
  primaryButtonClassName,
  secondaryButtonClassName,
} from '../../../shared/ui/class-names';
import {
  getFirstName,
  getGreetingForDate,
  getShiftForDate,
} from '../lib/shift-time';

interface OperationalHeaderProps {
  userFullName: string;
  now: Date;
  onNewObservation: () => void;
  onJumpToTasks: () => void;
}

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

export function OperationalHeader({
  userFullName,
  now,
  onNewObservation,
  onJumpToTasks,
}: OperationalHeaderProps) {
  const firstName = getFirstName(userFullName);
  const greeting = getGreetingForDate(now);
  const shift = getShiftForDate(now);
  const formattedDate = dateFormatter.format(now);
  const capitalizedDate =
    formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <section
      data-testid="operational-dashboard-header"
      className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-[rgba(0,102,132,0.08)] bg-white/92 px-5 py-4 shadow-panel backdrop-blur-sm"
    >
      <div className="grid gap-1">
        <h1 className="text-[1.35rem] font-bold tracking-[-0.03em] text-brand-text">
          {greeting}
          {firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="text-[0.95rem] text-brand-text-secondary">
          <span data-testid="operational-dashboard-shift-label">
            {shift.label} · {shift.rangeLabel}
          </span>
          <span className="mx-2 text-brand-text-muted">·</span>
          <span>{capitalizedDate}</span>
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          data-testid="operational-header-new-observation"
          className={primaryButtonClassName}
          onClick={onNewObservation}
        >
          Nueva observación
        </button>
        <button
          type="button"
          data-testid="operational-header-jump-to-tasks"
          className={secondaryButtonClassName}
          onClick={onJumpToTasks}
        >
          Ver tareas del día
        </button>
      </div>
    </section>
  );
}
