import { useMemo, useState } from 'react';

import type { TeamMemberOverview } from '@gentrix/shared-types';

import {
  badgeBaseClassName,
  inputClassName,
} from '../../../shared/ui/class-names';

interface StaffSettlementSelectorProps {
  externals: TeamMemberOverview[];
  selectedUserId: string | null;
  onSelect: (userId: string) => void;
}

export function StaffSettlementSelector({
  externals,
  selectedUserId,
  onSelect,
}: StaffSettlementSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return externals;
    return externals.filter(
      (member) =>
        member.fullName.toLowerCase().includes(normalized) ||
        member.email.toLowerCase().includes(normalized),
    );
  }, [externals, searchTerm]);

  return (
    <article className="rounded-[22px] border border-[rgba(0,102,132,0.08)] bg-white/92 p-4 shadow-panel backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-brand-primary">
          Personal externo
        </span>
        <span
          className={`${badgeBaseClassName} bg-brand-primary/12 text-brand-primary`}
        >
          {externals.length}
        </span>
      </div>

      <input
        data-testid="worked-hours-selector-search"
        className={inputClassName}
        type="search"
        placeholder="Buscar por nombre o email…"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
      />

      <div className="mt-3 grid max-h-[520px] gap-2 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="rounded-[16px] border border-dashed border-[rgba(0,102,132,0.18)] bg-brand-neutral px-3 py-4 text-center text-brand-text-secondary">
            {externals.length === 0
              ? 'No hay personal externo cargado.'
              : 'Sin resultados para esa búsqueda.'}
          </div>
        ) : (
          filtered.map((member) => {
            const isSelected = member.id === selectedUserId;
            return (
              <button
                key={member.id}
                type="button"
                data-testid={`worked-hours-external-${member.id}`}
                className={`grid gap-0.5 rounded-[18px] border px-3 py-3 text-left transition ${
                  isSelected
                    ? 'border-[rgba(0,102,132,0.26)] bg-brand-primary/8'
                    : 'border-[rgba(0,102,132,0.08)] bg-brand-neutral hover:border-[rgba(0,102,132,0.16)] hover:bg-white'
                }`}
                onClick={() => onSelect(member.id)}
              >
                <strong className="text-brand-text">{member.fullName}</strong>
                <span className="text-[0.85rem] text-brand-text-secondary">
                  {member.email}
                </span>
                {member.jobTitleLabel && (
                  <span className="text-[0.8rem] text-brand-text-muted">
                    {member.jobTitleLabel}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </article>
  );
}
