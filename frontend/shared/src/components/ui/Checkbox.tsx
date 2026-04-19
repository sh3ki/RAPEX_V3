'use client';

import { Check } from 'lucide-react';
import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  description?: ReactNode;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, label, description, error, id, disabled, ...props },
  ref,
) {
  const inputId = id || props.name;

  return (
    <label
      htmlFor={inputId}
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors',
        disabled ? 'cursor-not-allowed opacity-70' : 'hover:border-slate-300 hover:bg-slate-50/70',
        error ? 'border-red-300 bg-red-50/50' : 'border-slate-200 bg-white',
      )}
    >
      <span className="relative mt-0.5 inline-flex">
        <input
          id={inputId}
          ref={ref}
          type="checkbox"
          disabled={disabled}
          className={cn('peer sr-only', className)}
          {...props}
        />
        <span
          className={cn(
            'inline-flex h-5 w-5 items-center justify-center rounded-md border text-transparent transition-colors',
            'border-slate-300 bg-white peer-checked:border-primary-500 peer-checked:bg-primary-500 peer-checked:text-white',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500/25',
          )}
        >
          <Check size={13} strokeWidth={3} />
        </span>
      </span>
      <span className="flex-1">
        {label ? <span className="block text-sm font-semibold text-slate-700">{label}</span> : null}
        {description ? <span className="mt-0.5 block text-xs text-slate-500">{description}</span> : null}
        {error ? <span className="mt-1 block text-xs font-medium text-red-600">{error}</span> : null}
      </span>
    </label>
  );
});
