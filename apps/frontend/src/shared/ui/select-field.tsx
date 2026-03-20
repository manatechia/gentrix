import {
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';

import { inputClassName } from './class-names';

export interface SelectFieldOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  name: string;
  value: string;
  options: ReadonlyArray<SelectFieldOption>;
  placeholder?: string;
  allowEmptyOption?: boolean;
  disabled?: boolean;
  onChange: (nextValue: string) => void;
  onBlur?: () => void;
}

const triggerClassName = `${inputClassName} flex items-center justify-between gap-3 pr-3 text-left`;
const dropdownClassName =
  'absolute left-0 right-0 z-30 mt-2 max-h-[280px] overflow-y-auto rounded-[22px] border border-[rgba(0,102,132,0.12)] bg-white/98 p-2 shadow-[0_24px_48px_rgba(15,23,42,0.14)] backdrop-blur-sm';
const optionClassName =
  'flex w-full items-center justify-between gap-3 rounded-[16px] px-3 py-3 text-left text-[0.98rem] outline-none transition';

function resolveOptions(
  options: ReadonlyArray<SelectFieldOption>,
  placeholder: string,
  allowEmptyOption: boolean,
): SelectFieldOption[] {
  return allowEmptyOption
    ? [{ value: '', label: placeholder }, ...options]
    : [...options];
}

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

export function SelectField({
  name,
  value,
  options,
  placeholder = 'Seleccionar',
  allowEmptyOption = false,
  disabled = false,
  onChange,
  onBlur,
}: SelectFieldProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listboxId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const resolvedOptions = resolveOptions(options, placeholder, allowEmptyOption);
  const selectedOption =
    resolvedOptions.find((option) => option.value === value) ?? null;
  const [highlightedIndex, setHighlightedIndex] = useState(
    Math.max(
      resolvedOptions.findIndex((option) => option.value === value),
      0,
    ),
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const selectedIndex = resolveOptions(
      options,
      placeholder,
      allowEmptyOption,
    ).findIndex(
      (option) => option.value === value,
    );
    setHighlightedIndex(Math.max(selectedIndex, 0));
  }, [allowEmptyOption, isOpen, options, placeholder, value]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent): void {
      if (rootRef.current?.contains(event.target as Node)) {
        return;
      }

      setIsOpen(false);
      onBlur?.();
    }

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isOpen, onBlur]);

  function closeMenu(): void {
    setIsOpen(false);
  }

  function openMenu(): void {
    if (disabled || resolvedOptions.length === 0) {
      return;
    }

    setIsOpen(true);
  }

  function handleSelect(nextValue: string): void {
    onChange(nextValue);
    closeMenu();
    onBlur?.();
    triggerRef.current?.focus();
  }

  function handleTriggerBlur(
    event: FocusEvent<HTMLButtonElement>,
  ): void {
    if (rootRef.current?.contains(event.relatedTarget)) {
      return;
    }

    closeMenu();
    onBlur?.();
  }

  function handleTriggerKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
  ): void {
    if (disabled || resolvedOptions.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();

      if (!isOpen) {
        openMenu();
        return;
      }

      setHighlightedIndex((current) =>
        Math.min(current + 1, resolvedOptions.length - 1),
      );
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();

      if (!isOpen) {
        openMenu();
        return;
      }

      setHighlightedIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === 'Home' && isOpen) {
      event.preventDefault();
      setHighlightedIndex(0);
      return;
    }

    if (event.key === 'End' && isOpen) {
      event.preventDefault();
      setHighlightedIndex(resolvedOptions.length - 1);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();

      if (!isOpen) {
        openMenu();
        return;
      }

      const highlightedOption = resolvedOptions[highlightedIndex];

      if (highlightedOption) {
        handleSelect(highlightedOption.value);
      }
      return;
    }

    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      closeMenu();
      onBlur?.();
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        name={name}
        disabled={disabled}
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={triggerClassName}
        onBlur={handleTriggerBlur}
        onClick={() => {
          if (isOpen) {
            closeMenu();
            return;
          }

          openMenu();
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        <span
          className={
            selectedOption ? 'text-brand-text' : 'text-brand-text-secondary'
          }
        >
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronIcon open={isOpen} />
      </button>

      {isOpen ? (
        <div className={dropdownClassName}>
          <ul id={listboxId} role="listbox" className="grid gap-1">
            {resolvedOptions.map((option, index) => {
              const isSelected = option.value === value;
              const isHighlighted = index === highlightedIndex;

              return (
                <li
                  key={`${name}-${option.value || 'empty'}`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <button
                    type="button"
                    tabIndex={-1}
                    className={`${optionClassName} ${
                      isSelected
                        ? 'bg-brand-primary text-white shadow-[0_8px_18px_rgba(0,102,132,0.18)]'
                        : isHighlighted
                          ? 'bg-[rgba(0,102,132,0.08)] text-brand-text'
                          : 'text-brand-text hover:bg-[rgba(0,102,132,0.06)]'
                    }`}
                    onMouseDown={(event) => {
                      event.preventDefault();
                    }}
                    onMouseEnter={() => {
                      setHighlightedIndex(index);
                    }}
                    onClick={() => {
                      handleSelect(option.value);
                    }}
                  >
                    <span>{option.label}</span>
                    {isSelected ? <CheckIcon /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
