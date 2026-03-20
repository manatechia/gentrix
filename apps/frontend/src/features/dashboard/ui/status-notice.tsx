import {
  primaryButtonClassName,
  secondaryButtonClassName,
  shellCardClassName,
} from '../../../shared/ui/class-names';

export const primaryActionClassName = primaryButtonClassName;
export const secondaryActionClassName = secondaryButtonClassName;

interface StatusNoticeAction {
  label: string;
  onClick: () => void | Promise<void>;
  variant?: 'primary' | 'secondary';
}

interface StatusNoticeProps {
  title?: string;
  message: string;
  actions?: StatusNoticeAction[];
}

export function StatusNotice({
  title,
  message,
  actions,
}: StatusNoticeProps) {
  return (
    <section
      className={`${shellCardClassName} flex flex-wrap items-center justify-between gap-4 px-6 py-[22px] max-sm:flex-col max-sm:items-stretch`}
    >
      <div className="grid gap-1.5">
        {title && <strong className="text-brand-text">{title}</strong>}
        <span className="leading-[1.55] text-brand-text-secondary">
          {message}
        </span>
      </div>

      {actions && actions.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          {actions.map((action) => (
            <button
              key={action.label}
              className={
                action.variant === 'secondary'
                  ? secondaryActionClassName
                  : primaryActionClassName
              }
              type="button"
              onClick={() => {
                void action.onClick();
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
