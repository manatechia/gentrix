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

interface ShiftCoveragePanelProps {
  staff: StaffOverview[];
}

interface WardGroup {
  ward: string;
  total: number;
  byShift: Map<string, StaffOverview[]>;
}

function groupByWardAndShift(staff: StaffOverview[]): WardGroup[] {
  const active = staff.filter((member) => member.status === 'active');
  const wards = new Map<string, WardGroup>();

  for (const member of active) {
    const wardLabel = member.ward?.trim() || 'Sin asignar';
    let ward = wards.get(wardLabel);
    if (!ward) {
      ward = { ward: wardLabel, total: 0, byShift: new Map() };
      wards.set(wardLabel, ward);
    }
    ward.total += 1;
    const shift = member.shift?.trim() || 'sin-turno';
    const list = ward.byShift.get(shift) ?? [];
    list.push(member);
    ward.byShift.set(shift, list);
  }

  return [...wards.values()].sort((a, b) => a.ward.localeCompare(b.ward));
}

/**
 * Vista admin de cobertura agrupada por piso/sector y turno. Es descriptiva
 * (no hay un target de cobertura contra qué comparar), pero responde
 * "¿dónde y cuándo hay gente?".
 *
 * TODO (cuando exista el modelo): mostrar faltantes contra un target, o
 * turnos incompletos basados en StaffSchedule.
 */
export function ShiftCoveragePanel({ staff }: ShiftCoveragePanelProps) {
  const groups = groupByWardAndShift(staff);

  return (
    <section
      data-testid="shift-coverage-panel"
      className={`${surfaceCardClassName} grid gap-4`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
            Cobertura del turno
          </span>
          <p className="max-w-[60ch] leading-[1.55] text-brand-text-secondary">
            Personal activo agrupado por sector y turno.
          </p>
        </div>
        <Link
          to="/personal"
          data-testid="shift-coverage-manage-link"
          className={secondaryButtonClassName}
        >
          Gestionar
        </Link>
      </header>

      {groups.length === 0 ? (
        <article className="rounded-[22px] border border-dashed border-[rgba(0,102,132,0.22)] bg-white/70 px-4 py-4 text-brand-text-secondary">
          Sin personal activo en este momento.
        </article>
      ) : (
        <ul className="grid gap-3">
          {groups.map((group) => {
            const shifts = [...group.byShift.entries()].sort((a, b) =>
              a[0].localeCompare(b[0]),
            );
            return (
              <li
                key={group.ward}
                data-testid={`shift-coverage-ward-${group.ward}`}
                className="grid gap-2 rounded-[20px] border border-[rgba(0,102,132,0.1)] bg-white/95 px-4 py-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <strong className="text-[1rem] text-brand-text">
                    {group.ward}
                  </strong>
                  <span
                    className={`${badgeBaseClassName} bg-brand-primary/10 text-brand-primary`}
                  >
                    {group.total} {group.total === 1 ? 'persona' : 'personas'}
                  </span>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {shifts.map(([shift, members]) => {
                    const roleCounts = members.reduce<Record<string, number>>(
                      (acc, member) => {
                        const label = formatStaffRole(member.role);
                        acc[label] = (acc[label] ?? 0) + 1;
                        return acc;
                      },
                      {},
                    );
                    const rolesSummary = Object.entries(roleCounts)
                      .map(([label, count]) => `${count} ${label}`)
                      .join(' · ');
                    return (
                      <li
                        key={shift}
                        className="rounded-[14px] border border-[rgba(0,102,132,0.08)] bg-brand-neutral/60 px-3 py-1.5 text-[0.84rem] text-brand-text-secondary"
                      >
                        <strong className="text-brand-text">
                          {formatShiftLabel(shift)}:
                        </strong>{' '}
                        {rolesSummary || `${members.length}`}
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
