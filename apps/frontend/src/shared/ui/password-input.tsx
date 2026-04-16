import { forwardRef, useState, type InputHTMLAttributes } from 'react';

import { inputClassName } from './class-names';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ className, ...inputProps }, ref) {
    const [isVisible, setIsVisible] = useState(false);

    return (
      <div className="relative">
        <input
          {...inputProps}
          ref={ref}
          type={isVisible ? 'text' : 'password'}
          className={`${className ?? inputClassName} pr-12`}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={isVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={isVisible}
          onClick={() => setIsVisible((value) => !value)}
          className="absolute inset-y-0 right-2 my-auto grid h-9 w-9 place-items-center rounded-full text-brand-text-muted transition hover:bg-[rgba(0,102,132,0.08)] hover:text-brand-secondary focus:outline-none focus:ring-2 focus:ring-[rgba(0,102,132,0.24)]"
        >
          {isVisible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    );
  },
);

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M2.25 12s3.5-7 9.75-7 9.75 7 9.75 7-3.5 7-9.75 7S2.25 12 2.25 12z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M10.58 10.58a3 3 0 004.24 4.24"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.88 5.17A10.94 10.94 0 0112 5c6.25 0 9.75 7 9.75 7a17.6 17.6 0 01-3.17 4.19M6.16 6.16A17.54 17.54 0 002.25 12s3.5 7 9.75 7c1.63 0 3.1-.33 4.4-.86"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
