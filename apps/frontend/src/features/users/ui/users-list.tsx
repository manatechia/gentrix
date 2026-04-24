import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import type { UserOverview } from '@gentrix/shared-types';

import {
  formatAuthRole,
  formatEntityStatus,
} from '../../../shared/lib/display-labels';
import {
  badgeBaseClassName,
  inputClassName,
} from '../../../shared/ui/class-names';

type StaffFilter = 'all' | 'internal' | 'external' | 'access-granted' | 'access-pending';

interface UsersListProps {
  users: UserOverview[];
  resettingUserId: string | null;
  onResetClick: (user: UserOverview) => void;
  onAddClick: () => void;
}

interface FilterChipOption {
  value: StaffFilter;
  label: string;
  testId: string;
}

const filterChips: FilterChipOption[] = [
  { value: 'all', label: 'Todos', testId: 'users-filter-all' },
  { value: 'internal', label: 'Internos', testId: 'users-filter-internal' },
  { value: 'external', label: 'Externos', testId: 'users-filter-external' },
  {
    value: 'access-granted',
    label: 'Con acceso',
    testId: 'users-filter-access-granted',
  },
  {
    value: 'access-pending',
    label: 'Acceso pendiente',
    testId: 'users-filter-access-pending',
  },
];

function isExternal(user: UserOverview): boolean {
  return user.role === 'external';
}

function isAccessPending(user: UserOverview): boolean {
  return user.forcePasswordChange || user.passwordChangedAt === null;
}

function rowActionButtonClassName(): string {
  return 'inline-flex min-h-9 items-center justify-center rounded-xl border border-[rgba(47,79,79,0.16)] bg-white px-3 text-[0.85rem] font-semibold text-brand-secondary transition hover:-translate-y-px disabled:opacity-60';
}

function filterChipClassName(active: boolean): string {
  if (active) {
    return 'inline-flex min-h-9 items-center justify-center rounded-full bg-brand-primary px-4 text-[0.85rem] font-semibold text-white shadow-brand transition';
  }
  return 'inline-flex min-h-9 items-center justify-center rounded-full border border-[rgba(0,102,132,0.14)] bg-white px-4 text-[0.85rem] font-semibold text-brand-text-secondary transition hover:border-[rgba(0,102,132,0.32)] hover:text-brand-secondary';
}

export function UsersList({
  users,
  resettingUserId,
  onResetClick,
  onAddClick,
}: UsersListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<StaffFilter>('all');

  const filteredUsers = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      if (filter === 'internal' && isExternal(user)) return false;
      if (filter === 'external' && !isExternal(user)) return false;
      if (filter === 'access-granted' && isAccessPending(user)) return false;
      if (filter === 'access-pending' && !isAccessPending(user)) return false;

      if (!normalized) return true;
      return (
        user.fullName.toLowerCase().includes(normalized) ||
        user.email.toLowerCase().includes(normalized)
      );
    });
  }, [users, searchTerm, filter]);

  const hasFiltersApplied = filter !== 'all' || searchTerm.trim().length > 0;

  function clearFilters(): void {
    setSearchTerm('');
    setFilter('all');
  }

  return (
    <div className="grid gap-4" data-testid="users-list">
      <div className="grid gap-3">
        <input
          data-testid="users-list-search"
          className={inputClassName}
          type="search"
          placeholder="Buscar personal por nombre o email…"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />

        <div className="flex flex-wrap gap-2">
          {filterChips.map((chip) => (
            <button
              key={chip.value}
              type="button"
              data-testid={chip.testId}
              className={filterChipClassName(filter === chip.value)}
              onClick={() => setFilter(chip.value)}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {users.length === 0 ? (
        <EmptyState onAddClick={onAddClick} />
      ) : filteredUsers.length === 0 ? (
        <NoResultsState onClear={clearFilters} />
      ) : (
        <>
          <DesktopTable
            users={filteredUsers}
            resettingUserId={resettingUserId}
            onResetClick={onResetClick}
          />
          <MobileStack
            users={filteredUsers}
            resettingUserId={resettingUserId}
            onResetClick={onResetClick}
          />
        </>
      )}
    </div>
  );
}

function EmptyState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <div
      data-testid="users-list-empty"
      className="grid gap-3 rounded-[22px] border border-dashed border-[rgba(0,102,132,0.22)] bg-brand-neutral px-5 py-8 text-center"
    >
      <span className="text-brand-text font-semibold">
        Todavía no hay personal cargado.
      </span>
      <span className="text-brand-text-secondary">
        Empezá agregando al equipo que va a trabajar en esta organización.
      </span>
      <div className="flex justify-center">
        <button
          type="button"
          data-testid="users-list-empty-add"
          className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-brand-primary px-4 text-white font-semibold shadow-brand transition hover:-translate-y-px"
          onClick={onAddClick}
        >
          + Agregar personal
        </button>
      </div>
    </div>
  );
}

function NoResultsState({ onClear }: { onClear: () => void }) {
  return (
    <div
      data-testid="users-list-no-results"
      className="grid gap-2 rounded-[22px] border border-dashed border-[rgba(0,102,132,0.18)] bg-brand-neutral px-5 py-6 text-center"
    >
      <span className="text-brand-text font-semibold">
        Sin resultados con estos filtros.
      </span>
      <button
        type="button"
        className="mx-auto text-brand-secondary underline underline-offset-2"
        onClick={onClear}
      >
        Limpiar búsqueda y filtros
      </button>
    </div>
  );
}

interface RowsProps {
  users: UserOverview[];
  resettingUserId: string | null;
  onResetClick: (user: UserOverview) => void;
}

function DesktopTable({ users, resettingUserId, onResetClick }: RowsProps) {
  return (
    <div className="hidden overflow-hidden rounded-[22px] border border-[rgba(0,102,132,0.08)] bg-white md:block">
      <table className="w-full border-collapse text-left">
        <thead className="bg-brand-neutral/80">
          <tr className="text-[0.76rem] font-semibold uppercase tracking-[0.14em] text-brand-text-muted">
            <th className="px-4 py-3">Personal</th>
            <th className="px-4 py-3">Puesto</th>
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Acceso</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const external = isExternal(user);
            const pending = isAccessPending(user);
            return (
              <tr
                key={user.id}
                data-testid={`user-row-${user.id}`}
                className="border-t border-[rgba(0,102,132,0.06)] align-top transition hover:bg-brand-neutral/40"
              >
                <td className="px-4 py-3">
                  <div className="grid gap-0.5">
                    <span className="font-semibold text-brand-text">
                      {user.fullName}
                    </span>
                    <span className="text-[0.88rem] text-brand-text-secondary">
                      {user.email}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-brand-text">
                  {formatAuthRole(user.role)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`${badgeBaseClassName} ${
                      external
                        ? 'bg-[rgba(168,108,17,0.12)] text-[rgb(130,77,25)]'
                        : 'bg-brand-secondary/12 text-brand-secondary'
                    }`}
                  >
                    {external ? 'Externo' : 'Interno'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    data-testid={`user-row-${user.id}-access`}
                    className={`${badgeBaseClassName} ${
                      pending
                        ? 'bg-[rgba(168,108,17,0.12)] text-[rgb(130,77,25)]'
                        : 'bg-brand-primary/12 text-brand-primary'
                    }`}
                  >
                    {pending ? 'Pendiente' : 'Activo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-brand-text-secondary">
                  {formatEntityStatus(user.status)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    {external && (
                      <Link
                        to={`/personal/horas?externalId=${user.id}`}
                        data-testid={`user-row-${user.id}-hours-link`}
                        className={rowActionButtonClassName()}
                      >
                        Cargar horas
                      </Link>
                    )}
                    <button
                      type="button"
                      data-testid={`user-row-${user.id}-reset-button`}
                      className={rowActionButtonClassName()}
                      disabled={resettingUserId === user.id}
                      onClick={() => onResetClick(user)}
                    >
                      {resettingUserId === user.id
                        ? 'Reiniciando…'
                        : 'Restablecer acceso'}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MobileStack({ users, resettingUserId, onResetClick }: RowsProps) {
  return (
    <div className="grid gap-3 md:hidden">
      {users.map((user) => {
        const external = isExternal(user);
        const pending = isAccessPending(user);
        return (
          <article
            key={user.id}
            data-testid={`user-row-${user.id}-mobile`}
            className="grid gap-2 rounded-[20px] border border-[rgba(0,102,132,0.08)] bg-white px-4 py-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="grid gap-0.5">
                <strong className="text-brand-text">{user.fullName}</strong>
                <span className="text-[0.88rem] text-brand-text-secondary">
                  {user.email}
                </span>
              </div>
              <span
                className={`${badgeBaseClassName} ${
                  external
                    ? 'bg-[rgba(168,108,17,0.12)] text-[rgb(130,77,25)]'
                    : 'bg-brand-secondary/12 text-brand-secondary'
                }`}
              >
                {external ? 'Externo' : 'Interno'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-[0.88rem] text-brand-text-muted">
              <span>{formatAuthRole(user.role)}</span>
              <span aria-hidden="true">·</span>
              <span>Estado: {formatEntityStatus(user.status)}</span>
              <span aria-hidden="true">·</span>
              <span
                className={pending ? 'text-[rgb(130,77,25)]' : 'text-brand-primary'}
              >
                Acceso {pending ? 'pendiente' : 'activo'}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-2">
              {external && (
                <Link
                  to={`/personal/horas?externalId=${user.id}`}
                  className={rowActionButtonClassName()}
                >
                  Cargar horas
                </Link>
              )}
              <button
                type="button"
                className={rowActionButtonClassName()}
                disabled={resettingUserId === user.id}
                onClick={() => onResetClick(user)}
              >
                {resettingUserId === user.id
                  ? 'Reiniciando…'
                  : 'Restablecer acceso'}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
