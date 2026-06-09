'use client';

import { useMemo, useRef } from 'react';
import { cn } from '../../utils/cn';

interface OtpInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  length?: number;
  error?: string;
  hint?: string;
  disabled?: boolean;
}

export function OtpInput({
  label,
  value,
  onChange,
  length = 6,
  error,
  hint,
  disabled = false,
}: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const digits = useMemo(() => {
    const normalized = value.replace(/\D/g, '').slice(0, length);
    return Array.from({ length }, (_, index) => normalized[index] || '');
  }, [length, value]);

  const writeDigitAt = (digit: string, index: number) => {
    const next = [...digits];
    next[index] = digit;
    onChange(next.join(''));
  };

  const clearDigitAt = (index: number) => {
    const next = [...digits];
    next[index] = '';
    onChange(next.join(''));
  };

  return (
    <div className="space-y-2">
      {label ? <label className={cn('text-sm font-semibold', error ? 'text-red-700' : 'text-slate-700')}>{label}</label> : null}

      <div className="flex items-center gap-2">
        {digits.map((digit, index) => (
          <input
            key={`otp-${index}`}
            ref={(element) => {
              inputRefs.current[index] = element;
            }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={digit}
            disabled={disabled}
            onChange={(event) => {
              const onlyDigit = event.target.value.replace(/\D/g, '').slice(-1);
              writeDigitAt(onlyDigit, index);

              if (onlyDigit && index < length - 1) {
                inputRefs.current[index + 1]?.focus();
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Backspace' && !digits[index]) {
                if (index > 0) {
                  inputRefs.current[index - 1]?.focus();
                }
                return;
              }

              if (event.key === 'Backspace') {
                clearDigitAt(index);
                return;
              }

              if (event.key === 'ArrowLeft' && index > 0) {
                inputRefs.current[index - 1]?.focus();
              }

              if (event.key === 'ArrowRight' && index < length - 1) {
                inputRefs.current[index + 1]?.focus();
              }
            }}
            onPaste={(event) => {
              event.preventDefault();
              const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
              if (!pasted) {
                return;
              }

              const next = Array.from({ length }, (_, i) => pasted[i] || '');
              onChange(next.join(''));

              const nextIndex = Math.min(pasted.length, length - 1);
              inputRefs.current[nextIndex]?.focus();
            }}
            className={cn(
              'h-12 w-11 rounded-xl border bg-white text-center text-lg font-semibold tracking-wide text-slate-900 shadow-sm outline-none transition',
              error ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100' : 'border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200',
              disabled ? 'cursor-not-allowed bg-slate-100 text-slate-500' : '',
            )}
          />
        ))}
      </div>

      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}