import { Link } from 'react-router-dom';

import type { StaffOverview } from '@gentrix/shared-types';

import {
  formatShiftLabel,
  formatStaffRole,
} from '../../../shared/lib/display-labels';
import {
  badgeBaseClassName,
  secondaryButtonClassName,
  surfaceCardClassName,
} from '../../../shared/ui/class-names';

interface StaffPanelProps {
  staff: StaffOverview[];
}

export function StaffPanel({ staff }: StaffPanelProps) {
  return (
    <article className={surfaceCardClassName}>
      <div className="mb-[18px] flex items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-primary">
            Personal
          </span>
          <h2 className="mt-1 text-[1.35rem] font-bold tracking-[-0.04em] text-brand-text">
            Cobertura del turno
          </h2>
        </div>

        <Link className={secondaryButtonClassName} to="/personal">
          Gestionar
        </Link>
      </div>

      <div className="grid gap-3">
        {staff.map((member) => (
          <article
            key={member.id}
            className="rounded-[22px] border border-[rgba(0,102,132,0.08)] bg-brand-neutral p-[18px]"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="text-base font-semibold text-brand-text">
                {member.name}
              </span>
              <span
                className={`${badgeBaseClassName} bg-brand-secondary/12 text-brand-secondary`}
              >
                {formatShiftLabel(member.shift)}
              </span>
            </div>
            <p className="mt-2 leading-[1.65] text-brand-text-secondary">
              {member.assignment}
            </p>
            <p className="mt-1 text-sm text-brand-text-muted">
              {formatStaffRole(member.role)} / {member.ward}
            </p>
          </article>
        ))}
      </div>
    </article>
  );
}
