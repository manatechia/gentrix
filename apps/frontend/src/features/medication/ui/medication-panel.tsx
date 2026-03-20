import type { MedicationOverview } from '@gentrix/shared-types';

import { formatEntityStatus } from '../../../shared/lib/display-labels';
import {
  badgeBaseClassName,
  surfaceCardClassName,
} from '../../../shared/ui/class-names';

interface MedicationPanelProps {
  medications: MedicationOverview[];
}

export function MedicationPanel({ medications }: MedicationPanelProps) {
  return (
    <article className={surfaceCardClassName}>
      <div className="mb-[18px]">
        <span className="inline-flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-primary">
          Medicacion
        </span>
        <h2 className="mt-1 text-[1.35rem] font-bold tracking-[-0.04em] text-brand-text">
          Agenda de medicacion
        </h2>
      </div>

      <div className="grid gap-3">
        {medications.map((order) => (
          <article
            key={order.id}
            className="rounded-[22px] border border-[rgba(0,102,132,0.08)] bg-brand-neutral p-[18px]"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="text-base font-semibold text-brand-text">
                {order.medicationName}
              </span>
              <span
                className={[
                  badgeBaseClassName,
                  order.active
                    ? 'bg-brand-primary/12 text-brand-primary'
                    : 'bg-brand-tertiary/14 text-brand-tertiary',
                ].join(' ')}
              >
                {formatEntityStatus(order.active ? 'active' : 'inactive')}
              </span>
            </div>
            <p className="mt-2 leading-[1.65] text-brand-text-secondary">
              {order.residentName}
            </p>
            <p className="mt-1 font-medium text-brand-text">{order.schedule}</p>
          </article>
        ))}
      </div>
    </article>
  );
}
