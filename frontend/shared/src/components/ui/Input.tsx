'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  inputLabel?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, inputLabel, hint, error, className, id, ...props },
  ref,
) {
  const inputId = id || props.name;

  return (
    <div className="space-y-1.5">
      {(label || inputLabel) && (
        <div className="flex items-center justify-between">
          {label ? (
            <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
              {label}
            </label>
          ) : (
            <span />
          )}
          {inputLabel && <span className="text-xs font-medium uppercase tracking-wide text-gray-400">{inputLabel}</span>}
        </div>
      )}
      <input
        id={inputId}
        ref={ref}
        className={cn(
          'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900',
          'placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
          error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : '',
          className,
        )}
        {...props}
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
});
