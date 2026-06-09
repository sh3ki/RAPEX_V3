'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  inputLabel?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    inputLabel,
    hint,
    error,
    leftIcon,
    rightIcon,
    className,
    containerClassName,
    id,
    ...props
  },
  ref,
) {
  const inputId = id || props.name;

  return (
    <div className={cn('space-y-1.5', containerClassName)}>
      {(label || inputLabel) && (
        <div className="flex items-center justify-between">
          {label ? (
            <label htmlFor={inputId} className="text-sm font-semibold text-slate-700">
              {label}
            </label>
          ) : (
            <span />
          )}
          {inputLabel && <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{inputLabel}</span>}
        </div>
      )}
      <div
        className={cn(
          'group flex items-center rounded-xl border bg-white shadow-sm transition-all',
          error
            ? 'border-red-300 ring-2 ring-red-500/10'
            : 'border-slate-300 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-500/15',
        )}
      >
        {leftIcon ? <span className="pl-3 text-slate-400">{leftIcon}</span> : null}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'w-full rounded-xl bg-transparent px-3.5 py-2.5 text-sm text-slate-900',
            'placeholder:text-slate-400 focus:outline-none',
            leftIcon ? 'pl-2' : '',
            rightIcon ? 'pr-2' : '',
            className,
          )}
          {...props}
        />
        {rightIcon ? <span className="pr-3 text-slate-400">{rightIcon}</span> : null}
      </div>
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
});
