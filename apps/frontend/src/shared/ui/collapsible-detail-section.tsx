import type { ReactNode } from 'react';

import { surfaceCardClassName } from './class-names';

interface CollapsibleDetailSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  testId?: string;
}

export function CollapsibleDetailSection({
  title,
  children,
  defaultOpen = false,
  testId,
}: CollapsibleDetailSectionProps) {
  return (
    <details
      data-testid={testId}
      className={`${surfaceCardClassName} group`}
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className="h-4 w-4 shrink-0 text-brand-text-muted transition-transform group-open:rotate-180"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}
