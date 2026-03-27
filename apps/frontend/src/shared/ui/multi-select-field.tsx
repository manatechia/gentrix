import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';

import { inputClassName, secondaryButtonClassName } from './class-names';
import { buildOptionTestId } from '../lib/test-id';
import type { SelectFieldOption } from './select-field';

interface MultiSelectFieldProps {
  name: string;
  values: ReadonlyArray<string>;
  options: ReadonlyArray<SelectFieldOption>;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  testId?: string;
  onChange: (nextValues: string[]) => void;
  onBlur?: () => void;
}

const triggerClassName = `${inputClassName} flex items-center justify-between gap-3 pr-3 text-left`;
const searchTriggerClassName =
  'min-h-[54px] w-full rounded-2xl border border-[rgba(47,79,79,0.16)] bg-brand-neutral px-4 text-brand-text transition focus-within:border-[rgba(0,102,132,0.36)] focus-within:ring-4 focus-within:ring-[rgba(0,102,132,0.12)]';
const dropdownClassName =
  'absolute left-0 right-0 z-30 mt-2 rounded-[22px] border border-[rgba(0,102,132,0.12)] bg-white/98 p-3 shadow-[0_24px_48px_rgba(15,23,42,0.14)] backdrop-blur-sm';
const optionButtonClassName =
  'flex w-full items-center justify-between gap-3 rounded-[16px] px-3 py-3 text-left text-[0.98rem] outline-none transition';

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={`h-4 w-4 shrink-0 text-brand-primary transition-transform duration-200 ${
        open ? 'rotate-180' : ''
      }`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M5 8L10 13L15 8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4 shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M5.5 10.5L8.5 13.5L14.5 7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getSelectionSummary(
  selectedOptions: ReadonlyArray<SelectFieldOption>,
  placeholder: string,
): string {
  if (selectedOptions.length === 0) {
    return placeholder;
  }

  if (selectedOptions.length === 1) {
    return selectedOptions[0].label;
  }

  if (selectedOptions.length === 2) {
    return `${selectedOptions[0].label}, ${selectedOptions[1].label}`;
  }

  return `${selectedOptions.length} seleccionados`;
}

export function MultiSelectField({
  name,
  values,
  options,
  placeholder = 'Seleccionar',
  searchPlaceholder = 'Buscar',
  disabled = false,
  testId,
  onChange,
  onBlur,
}: MultiSelectFieldProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const listboxId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedOptions = useMemo(
    () => options.filter((option) => values.includes(option.value)),
    [options, values],
  );
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return [...options];
    }

    return options.filter((option) =>
      option.label.toLowerCase().includes(normalizedQuery),
    );
  }, [options, query]);
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    searchInputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent): void {
      if (rootRef.current?.contains(event.target as Node)) {
        return;
      }

      setIsOpen(false);
      setQuery('');
      onBlur?.();
    }

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isOpen, onBlur]);

  function handleTriggerKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
  ): void {
    if (disabled || options.length === 0) {
      return;
    }

    if (
      event.key === 'ArrowDown' ||
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault();
      setIsOpen(true);
    }

    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      setIsOpen(false);
      setQuery('');
      onBlur?.();
    }
  }

  function toggleOption(nextValue: string): void {
    if (values.includes(nextValue)) {
      onChange(values.filter((value) => value !== nextValue));
      return;
    }

    onChange([...values, nextValue]);
  }

  function clearSelection(): void {
    onChange([]);
    setQuery('');
    searchInputRef.current?.focus();
  }

  function closeDropdown(options?: { focusTrigger?: boolean }): void {
    setIsOpen(false);
    setQuery('');
    onBlur?.();

    if (options?.focusTrigger) {
      window.requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    }
  }

  return (
    <div ref={rootRef} className="relative">
      {isOpen ? (
        <div className={`${searchTriggerClassName} flex items-center gap-3 pr-3`}>
          <input
            ref={searchInputRef}
            data-testid={testId ? `${testId}-search` : undefined}
            className="min-w-0 flex-1 bg-transparent text-brand-text outline-none placeholder:text-brand-text-secondary"
            type="search"
            placeholder={searchPlaceholder}
            value={query}
            onBlur={(event) => {
              if (rootRef.current?.contains(event.relatedTarget as Node | null)) {
                return;
              }

              closeDropdown();
            }}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                closeDropdown({ focusTrigger: true });
              }
            }}
          />

          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-brand-primary transition hover:bg-[rgba(0,102,132,0.08)]"
            aria-label="Cerrar busqueda"
            onClick={() => {
              closeDropdown({ focusTrigger: true });
            }}
          >
            <ChevronIcon open={isOpen} />
          </button>
        </div>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          name={name}
          data-testid={testId}
          disabled={disabled}
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className={triggerClassName}
          onClick={() => {
            if (!disabled && options.length > 0) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleTriggerKeyDown}
        >
          <span
            className={
              selectedOptions.length > 0
                ? 'truncate text-brand-text'
                : 'truncate text-brand-text-secondary'
            }
            title={getSelectionSummary(selectedOptions, placeholder)}
          >
            {getSelectionSummary(selectedOptions, placeholder)}
          </span>
          <ChevronIcon open={isOpen} />
        </button>
      )}

      {isOpen ? (
        <div
          className={dropdownClassName}
          data-testid={testId ? `${testId}-dropdown` : undefined}
        >
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-[0.88rem] text-brand-text-secondary">
                {selectedOptions.length === 0
                  ? 'Sin residentes seleccionados.'
                  : `${selectedOptions.length} residentes seleccionados.`}
              </span>

              {selectedOptions.length > 0 ? (
                <button
                  className={secondaryButtonClassName}
                  type="button"
                  data-testid={testId ? `${testId}-clear` : undefined}
                  onClick={clearSelection}
                >
                  Limpiar
                </button>
              ) : null}
            </div>

            {filteredOptions.length === 0 ? (
              <div className="rounded-[18px] border border-dashed border-[rgba(0,102,132,0.18)] bg-brand-neutral/60 px-4 py-4 text-brand-text-secondary">
                No encontre residentes para esa busqueda.
              </div>
            ) : (
              <ul
                id={listboxId}
                role="listbox"
                aria-multiselectable="true"
                className="grid max-h-[260px] gap-1 overflow-y-auto"
              >
                {filteredOptions.map((option) => {
                  const isSelected = values.includes(option.value);

                  return (
                    <li
                      key={`${name}-${option.value}`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <button
                        type="button"
                        data-testid={
                          testId
                            ? buildOptionTestId(testId, option.value)
                            : undefined
                        }
                        className={`${optionButtonClassName} ${
                          isSelected
                            ? 'bg-brand-primary text-white shadow-[0_8px_18px_rgba(0,102,132,0.18)]'
                            : 'text-brand-text hover:bg-[rgba(0,102,132,0.06)]'
                        }`}
                        onMouseDown={(event) => {
                          event.preventDefault();
                        }}
                        onClick={() => {
                          toggleOption(option.value);
                        }}
                      >
                        <span>{option.label}</span>
                        {isSelected ? <CheckIcon /> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
