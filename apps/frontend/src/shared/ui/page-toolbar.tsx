import type { ReactNode } from 'react';

import { BackChevronButton } from './back-chevron-button';
import { shellCardClassName } from './class-names';

interface PageToolbarProps {
  section: string;
  title?: string;
  actions?: ReactNode;
  backTitle?: string;
  backFallbackTo?: string;
}

export function PageToolbar({
  section,
  title,
  actions,
  backTitle,
  backFallbackTo,
}: PageToolbarProps) {
  const hasBackAction = backTitle || backFallbackTo;

  return (
    <section
      className={`${shellCardClassName} flex flex-wrap items-center justify-between gap-3 px-4 py-3 min-[900px]:px-5`}
    >
      <div className="flex min-w-0 items-center gap-3">
        {hasBackAction ? (
          <BackChevronButton title={backTitle} fallbackTo={backFallbackTo} />
        ) : null}

        <div className="grid gap-0.5">
          <span className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
            {section}
          </span>
          {title ? (
            <h1 className="text-[1.08rem] font-semibold tracking-[-0.03em] text-brand-text min-[640px]:text-[1.2rem]">
              {title}
            </h1>
          ) : null}
        </div>
      </div>

      {actions ? (
        <div className="flex flex-wrap items-center gap-2.5">{actions}</div>
      ) : null}
    </section>
  );
}
