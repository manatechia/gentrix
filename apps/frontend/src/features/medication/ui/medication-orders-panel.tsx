import { Link } from 'react-router-dom';

import type { MedicationOverview } from '@gentrix/shared-types';

import {
  formatEntityStatus,
  formatMedicationFrequency,
  formatMedicationRoute,
} from '../../../shared/lib/display-labels';
import {
  badgeBaseClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  surfaceCardClassName,
} from '../../../shared/ui/class-names';
import { MultiSelectField } from '../../../shared/ui/multi-select-field';
import type { SelectFieldOption } from '../../../shared/ui/select-field';

interface MedicationOrdersPanelProps {
  medications: MedicationOverview[];
  activeMedicationCount: number;
  residentOptions: ReadonlyArray<SelectFieldOption>;
  selectedResidentIds: ReadonlyArray<string>;
  onSelectedResidentIdsChange: (nextValues: string[]) => void;
  filterSummary: string;
  isFiltered?: boolean;
  emptyStateMessage?: string;
}

function SummaryTile({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <article className="rounded-[22px] border border-[rgba(0,102,132,0.08)] bg-brand-neutral/60 px-5 py-4">
      <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
        {label}
      </span>
      <strong className="mt-2 block text-[1.8rem] leading-none tracking-[-0.05em] text-brand-text">
        {value}
      </strong>
    </article>
  );
}

export function MedicationOrdersPanel({
  medications,
  activeMedicationCount,
  residentOptions,
  selectedResidentIds,
  onSelectedResidentIdsChange,
  filterSummary,
  isFiltered = false,
  emptyStateMessage = 'Todavia no hay ordenes de medicacion cargadas.',
}: MedicationOrdersPanelProps) {
  const pendingMedicationCount = Math.max(
    medications.length - activeMedicationCount,
    0,
  );

  return (
    <article className={surfaceCardClassName}>
      <div className="mb-[18px] flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-primary">
            Medicacion
          </span>
          <h2 className="mt-1 text-[1.35rem] font-bold tracking-[-0.04em] text-brand-text">
            Ordenes activas y programadas
          </h2>
        </div>

        <Link className={primaryButtonClassName} to="/medicacion/nueva">
          Nueva orden
        </Link>
      </div>

      <div className="mb-4 grid gap-4 rounded-[24px] border border-[rgba(0,102,132,0.08)] bg-brand-neutral/45 p-4 min-[1080px]:grid-cols-[minmax(0,340px)_auto] min-[1080px]:items-end">
        <label className="grid gap-2.5">
          <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
            Filtrar por paciente
          </span>
          <MultiSelectField
            name="residentMedicationFilter"
            values={selectedResidentIds}
            options={residentOptions}
            placeholder="Todos los pacientes"
            searchPlaceholder="Buscar paciente o habitacion"
            onChange={onSelectedResidentIdsChange}
          />
        </label>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="max-w-[64ch] leading-[1.65] text-brand-text-secondary">
            {filterSummary}
          </p>

          {selectedResidentIds.length > 0 ? (
            <button
              className={secondaryButtonClassName}
              type="button"
              onClick={() => {
                onSelectedResidentIdsChange([]);
              }}
            >
              Limpiar filtro
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 min-[860px]:grid-cols-3">
        <SummaryTile
          label={isFiltered ? 'Ordenes visibles' : 'Ordenes totales'}
          value={medications.length}
        />
        <SummaryTile
          label={isFiltered ? 'Activas visibles' : 'Activas hoy'}
          value={activeMedicationCount}
        />
        <SummaryTile
          label="Pendientes o cerradas"
          value={pendingMedicationCount}
        />
      </div>

      {medications.length === 0 ? (
        <div className="mt-4 rounded-[24px] border border-dashed border-[rgba(0,102,132,0.22)] bg-brand-neutral/60 px-5 py-5 text-brand-text-secondary">
          {emptyStateMessage}
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {medications.map((order) => (
            <article
              key={order.id}
              className="rounded-[24px] border border-[rgba(0,102,132,0.08)] bg-brand-neutral/70 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="grid gap-1">
                  <strong className="text-[1.05rem] text-brand-text">
                    {order.medicationName}
                  </strong>
                  <span className="leading-[1.55] text-brand-text-secondary">
                    {order.residentName}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={[
                      badgeBaseClassName,
                      order.active
                        ? 'bg-brand-primary/12 text-brand-primary'
                        : 'bg-brand-tertiary/14 text-brand-tertiary',
                    ].join(' ')}
                  >
                    {order.active ? 'Activa hoy' : formatEntityStatus(order.status)}
                  </span>

                  <Link
                    className={secondaryButtonClassName}
                    to={`/medicacion/${order.id}/editar`}
                  >
                    Editar
                  </Link>
                </div>
              </div>

              <div className="mt-4 grid gap-3 min-[920px]:grid-cols-4">
                <div className="grid gap-1">
                  <span className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
                    Dosis
                  </span>
                  <span className="text-brand-text">{order.dose}</span>
                </div>

                <div className="grid gap-1">
                  <span className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
                    Via
                  </span>
                  <span className="text-brand-text">
                    {formatMedicationRoute(order.route)}
                  </span>
                </div>

                <div className="grid gap-1">
                  <span className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
                    Frecuencia
                  </span>
                  <span className="text-brand-text">
                    {formatMedicationFrequency(order.frequency)}
                  </span>
                </div>

                <div className="grid gap-1">
                  <span className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
                    Vigencia
                  </span>
                  <span className="text-brand-text">
                    {order.startDate.slice(0, 10)}
                    {order.endDate ? ` al ${order.endDate.slice(0, 10)}` : ' sin fin'}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-1">
                <span className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
                  Agenda
                </span>
                <span className="text-brand-text">{order.schedule}</span>
                <span className="text-brand-text-secondary">
                  Prescripto por {order.prescribedBy}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </article>
  );
}
