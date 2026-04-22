import type { ResidentLiveProfile } from '@gentrix/shared-types';

import {
  formatEntityStatus,
  formatMedicationFrequency,
  formatMedicationRoute,
  formatResidentCareLevel,
  formatResidentDocumentType,
} from '../../../shared/lib/display-labels';
import {
  badgeBaseClassName,
  surfaceCardClassName,
} from '../../../shared/ui/class-names';

interface ResidentLiveProfilePanelProps {
  profile: ResidentLiveProfile | null;
}

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'long',
});

function showValue(value: string | undefined): string {
  if (!value || !value.trim()) {
    return 'No informado';
  }

  return value;
}

function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

export function ResidentLiveProfilePanel({
  profile,
}: ResidentLiveProfilePanelProps) {
  return (
    <>
      <section className={surfaceCardClassName}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-1.5">
            <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
              Ficha viva minima
            </span>
            <p className="max-w-[62ch] leading-[1.65] text-brand-text-secondary">
              Lectura agregada del residente con perfil base y medicacion activa.
            </p>
          </div>
          {profile && (
            <span
              className={`${badgeBaseClassName} w-fit bg-brand-secondary/10 text-brand-secondary`}
            >
              {formatEntityStatus(profile.resident.status)}
            </span>
          )}
        </div>

        {!profile ? (
          <p className="mt-4 leading-[1.65] text-brand-text-secondary">
            No pude cargar la lectura agregada de ficha viva.
          </p>
        ) : (
          <div className="mt-5 grid gap-3 min-[720px]:grid-cols-2 min-[1100px]:grid-cols-3">
            <SummaryCard
              label="Interno"
              value={showValue(profile.resident.internalNumber)}
            />
            <SummaryCard
              label="Documento"
              value={`${formatResidentDocumentType(profile.resident.documentType)} ${profile.resident.documentNumber}`}
            />
            <SummaryCard
              label="Habitacion actual"
              value={showValue(profile.resident.room)}
            />
            <SummaryCard
              label="Nivel de cuidado"
              value={formatResidentCareLevel(profile.resident.careLevel)}
            />
            <SummaryCard
              label="Ingreso"
              value={formatDate(profile.resident.admissionDate)}
            />
            <SummaryCard
              label="Correo"
              value={showValue(profile.resident.email)}
            />
          </div>
        )}
      </section>

      <section className={surfaceCardClassName}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1.5">
            <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
              Medicacion activa
            </span>
            <p className="leading-[1.6] text-brand-text-secondary">
              Ordenes vigentes para la operacion diaria del residente.
            </p>
          </div>
          {profile && (
            <span className={badgeBaseClassName}>
              {profile.activeMedications.length} activas
            </span>
          )}
        </div>

        {!profile || profile.activeMedications.length === 0 ? (
          <p className="mt-4 leading-[1.65] text-brand-text-secondary">
            No hay medicacion activa para este residente.
          </p>
        ) : (
          <div className="mt-4 grid gap-3">
            {profile.activeMedications.map((medication) => (
              <article
                key={medication.id}
                className="rounded-[22px] bg-brand-neutral px-4 py-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-brand-text">
                    {medication.medicationName}
                  </strong>
                  <span className="text-[0.88rem] text-brand-text-secondary">
                    {medication.dose}
                  </span>
                </div>
                <div className="mt-2 grid gap-2 text-[0.95rem] text-brand-text-secondary">
                  <span>
                    {formatMedicationRoute(medication.route)} |{' '}
                    {formatMedicationFrequency(medication.frequency)}
                  </span>
                  <span>{medication.schedule}</span>
                  <span>Prescripta por {medication.prescribedBy}</span>
                  <span>
                    Vigencia desde {formatDate(medication.startDate)}
                    {medication.endDate
                      ? ` hasta ${formatDate(medication.endDate)}`
                      : ''}
                  </span>
                  <span className="text-[0.82rem] text-brand-text-muted">
                    Cargada por {medication.audit.createdBy}
                    {medication.audit.updatedAt !== medication.audit.createdAt &&
                      medication.audit.updatedBy &&
                      medication.audit.updatedBy !== medication.audit.createdBy
                      ? ` · editada por ${medication.audit.updatedBy}`
                      : ''}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[22px] bg-brand-neutral px-4 py-4">
      <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
        {label}
      </span>
      <strong className="mt-2 block text-brand-text">{value}</strong>
    </article>
  );
}
