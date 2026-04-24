import { useEffect, useState } from 'react';

import type { HourSettlementDetail } from '@gentrix/shared-types';

import {
  badgeBaseClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from '../../../shared/ui/class-names';
import { isoToAr } from '../lib/date-format';

interface SettlementDetailDrawerProps {
  isOpen: boolean;
  detail: HourSettlementDetail | null;
  memberName: string;
  isSaving: boolean;
  onClose: () => void;
  onMarkPaid: (settlementId: string) => Promise<void> | void;
}

export function SettlementDetailDrawer({
  isOpen,
  detail,
  memberName,
  isSaving,
  onClose,
  onMarkPaid,
}: SettlementDetailDrawerProps) {
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);

  useEffect(() => {
    if (!isOpen) setIsConfirmingPayment(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(event: KeyboardEvent): void {
      if (event.key === 'Escape' && !isSaving) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen || !detail) return null;

  const stateBadgeClass =
    detail.status === 'cancelled'
      ? 'bg-[rgba(168,43,17,0.12)] text-[rgb(130,44,25)]'
      : 'bg-brand-primary/12 text-brand-primary';
  const stateLabel = detail.status === 'cancelled' ? 'Cancelada' : 'Liquidada';
  const paymentLabel =
    detail.status === 'paid'
      ? 'Pagada'
      : detail.status === 'cancelled'
        ? '—'
        : 'Pendiente';
  const paymentBadgeClass =
    detail.status === 'paid'
      ? 'bg-[rgba(20,108,56,0.12)] text-[rgb(20,108,56)]'
      : detail.status === 'cancelled'
        ? 'bg-brand-neutral text-brand-text-muted'
        : 'bg-[rgba(168,108,17,0.12)] text-[rgb(130,77,25)]';

  const canMarkPaid = detail.status === 'issued';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Detalle de liquidación"
      data-testid="worked-hours-settlement-detail-drawer"
      className="fixed inset-0 z-50 flex justify-end bg-[rgba(9,16,28,0.45)] print:static print:bg-white"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) onClose();
      }}
    >
      <div className="flex h-full w-full max-w-[640px] flex-col overflow-y-auto bg-white shadow-[-24px_0_48px_rgba(15,23,42,0.18)] print:w-full print:max-w-none print:shadow-none">
        <header className="flex items-start justify-between gap-3 border-b border-[rgba(0,102,132,0.08)] px-6 py-5 print:border-none">
          <div className="grid gap-1">
            <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary print:hidden">
              Detalle de liquidación
            </span>
            <h2 className="text-[1.25rem] font-bold tracking-[-0.04em] text-brand-text">
              {memberName}
            </h2>
            <span className="text-sm text-brand-text-secondary">
              Período {isoToAr(detail.periodStart)} →{' '}
              {isoToAr(detail.periodEnd)} · Emitida{' '}
              {isoToAr(detail.issuedAt)}
            </span>
            <div className="mt-1 flex flex-wrap gap-2">
              <span className={`${badgeBaseClassName} ${stateBadgeClass}`}>
                {stateLabel}
              </span>
              <span className={`${badgeBaseClassName} ${paymentBadgeClass}`}>
                Pago: {paymentLabel}
              </span>
              {detail.status === 'paid' && detail.paidAt && (
                <span className={`${badgeBaseClassName} bg-brand-neutral text-brand-text-muted`}>
                  Pagada el {isoToAr(detail.paidAt)}
                </span>
              )}
            </div>
            {detail.notes && (
              <p className="mt-2 text-sm text-brand-text-muted">
                Nota: {detail.notes}
              </p>
            )}
          </div>
          <div className="flex gap-2 print:hidden">
            <button
              type="button"
              aria-label="Imprimir"
              className="inline-flex min-h-9 items-center justify-center rounded-xl border border-[rgba(47,79,79,0.16)] bg-white px-3 text-[0.85rem] font-semibold text-brand-secondary transition hover:-translate-y-px"
              onClick={() => window.print()}
            >
              Imprimir
            </button>
            <button
              type="button"
              aria-label="Cerrar"
              className="-mr-2 rounded-full p-2 text-brand-text-muted transition hover:bg-brand-neutral hover:text-brand-text"
              disabled={isSaving}
              onClick={onClose}
            >
              <span aria-hidden="true" className="text-xl leading-none">
                ×
              </span>
            </button>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-5 px-6 py-5">
          <section className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-brand-text-muted">
                  <th className="py-2">Fecha</th>
                  <th>Horas</th>
                  <th>Tarifa</th>
                  <th className="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {detail.lines.map((line) => (
                  <tr
                    key={line.entryId}
                    className="border-t border-[rgba(0,102,132,0.08)]"
                  >
                    <td className="py-2">{isoToAr(line.workDate)}</td>
                    <td>{line.hours}</td>
                    <td>
                      {line.appliedCurrency} {line.appliedRate}
                    </td>
                    <td className="text-right text-brand-text">
                      {line.appliedCurrency} {line.subtotal}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[rgba(0,102,132,0.18)] font-semibold text-brand-text">
                  <td className="py-2">Totales</td>
                  <td>{detail.totalHours}</td>
                  <td></td>
                  <td className="text-right">
                    {detail.currency} {detail.totalAmount}
                  </td>
                </tr>
              </tfoot>
            </table>
          </section>

          {canMarkPaid && (
            <section className="grid gap-3 rounded-[18px] border border-[rgba(0,102,132,0.12)] bg-brand-primary/5 p-4 print:hidden">
              <div className="grid gap-1">
                <strong className="text-brand-text">Registrar pago</strong>
                <span className="text-sm text-brand-text-secondary">
                  Al confirmar se marca como pagada y se registra la fecha del
                  servidor.
                </span>
                <span className="text-[0.8rem] text-brand-text-muted">
                  Próximamente vas a poder guardar medio de pago y nota — hoy
                  no se persisten.
                </span>
              </div>
              {isConfirmingPayment ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={secondaryButtonClassName}
                    disabled={isSaving}
                    onClick={() => setIsConfirmingPayment(false)}
                  >
                    Volver
                  </button>
                  <button
                    type="button"
                    data-testid="worked-hours-settlement-detail-mark-paid-confirm"
                    className={primaryButtonClassName}
                    disabled={isSaving}
                    onClick={() => {
                      void onMarkPaid(detail.id);
                    }}
                  >
                    {isSaving ? 'Registrando…' : 'Confirmar pago'}
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap">
                  <button
                    type="button"
                    data-testid="worked-hours-settlement-detail-mark-paid"
                    className={primaryButtonClassName}
                    onClick={() => setIsConfirmingPayment(true)}
                  >
                    Marcar como pagada
                  </button>
                </div>
              )}
            </section>
          )}

          {detail.status === 'cancelled' && detail.cancelledAt && (
            <p className="text-sm text-[rgb(130,44,25)]">
              Cancelada el {isoToAr(detail.cancelledAt)}. Las horas volvieron a
              estar disponibles como borrador.
            </p>
          )}
        </div>

        <footer className="flex flex-wrap justify-end gap-3 border-t border-[rgba(0,102,132,0.08)] px-6 py-4 print:hidden">
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={onClose}
          >
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  );
}
