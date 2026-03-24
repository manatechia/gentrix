import { useNavigate } from 'react-router-dom';

interface BackChevronButtonProps {
  title?: string;
  fallbackTo?: string;
}

function canNavigateBack(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const historyState = window.history.state as { idx?: number } | null;
  return typeof historyState?.idx === 'number' && historyState.idx > 0;
}

export function BackChevronButton({
  title = 'Volver',
  fallbackTo,
}: BackChevronButtonProps) {
  const navigate = useNavigate();

  function handleClick(): void {
    if (canNavigateBack()) {
      navigate(-1);
      return;
    }

    if (fallbackTo) {
      navigate(fallbackTo, { replace: true });
    }
  }

  return (
    <button
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(47,79,79,0.16)] bg-white text-brand-secondary transition hover:-translate-y-px"
      type="button"
      title={title}
      aria-label={title}
      onClick={handleClick}
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        className="h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M11.75 4.75L6.5 10L11.75 15.25"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
