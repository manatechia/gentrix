import { Link } from 'react-router-dom';

import type { ResidentOverview } from '@gentrix/shared-types';

import {
  formatEntityStatus,
  formatResidentCareLevel,
} from '../../../shared/lib/display-labels';
import {
  badgeBaseClassName,
  surfaceCardClassName,
} from '../../../shared/ui/class-names';

interface ResidentsPanelProps {
  residents: ResidentOverview[];
  memoryCareResidents: number;
  residentBasePath?: string;
}

export function ResidentsPanel({
  residents,
  memoryCareResidents,
  residentBasePath,
}: ResidentsPanelProps) {
  return (
    <article className={`${surfaceCardClassName} grid content-start`}>
      <div className="mb-[18px] flex items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-primary">
            Residentes
          </span>
          <h2 className="mt-1 text-[1.35rem] font-bold tracking-[-0.04em] text-brand-text">
            Vista general de residentes
          </h2>
        </div>
        <span
          className={`${badgeBaseClassName} bg-brand-secondary/9 text-brand-secondary`}
        >
          {memoryCareResidents} en cuidado de memoria
        </span>
      </div>

      <div className="grid gap-3 min-[680px]:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
        {residents.length > 0 ? (
          residents.map((resident) => (
            <Link
              key={resident.id}
              className="block rounded-[22px] border border-[rgba(0,102,132,0.08)] bg-brand-neutral p-[18px] no-underline transition hover:-translate-y-px hover:border-[rgba(0,102,132,0.16)] hover:shadow-panel"
              to={
                residentBasePath
                  ? `${residentBasePath}/${resident.id}`
                  : '#'
              }
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-base font-semibold text-brand-text">
                  {resident.fullName}
                </span>
                <span
                  className={`${badgeBaseClassName} bg-brand-primary/12 text-brand-primary`}
                >
                  {formatEntityStatus(resident.status)}
                </span>
              </div>
              <p className="mt-2 leading-[1.65] text-brand-text-secondary">
                Habitacion {resident.room} / {resident.age} anos
              </p>
              <div className="mt-4 grid gap-2">
                <span className="h-[5px] w-[74%] rounded-full bg-brand-primary" />
                <span className="h-[5px] w-[88%] rounded-full bg-brand-secondary/78" />
                <span className="h-[5px] w-[52%] rounded-full bg-brand-tertiary" />
              </div>
              <div className="mt-3.5 flex items-center justify-between gap-3">
                <p className="font-semibold text-brand-secondary">
                  {formatResidentCareLevel(resident.careLevel)}
                </p>
                <span className="text-[0.82rem] font-semibold uppercase tracking-[0.08em] text-brand-primary">
                  Ver detalle
                </span>
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-[22px] border border-dashed border-[rgba(47,79,79,0.18)] bg-brand-neutral p-6 text-brand-text-secondary">
            No hay residentes para el filtro actual.
          </div>
        )}
      </div>
    </article>
  );
}
