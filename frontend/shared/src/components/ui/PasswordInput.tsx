'use client';

import { CheckCircle2, Eye, EyeOff, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Input } from './Input';

interface PasswordInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  disabled?: boolean;
}

interface ConfirmPasswordInputProps {
  label?: string;
  password: string;
  confirmPassword: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

interface PasswordRule {
  key: string;
  label: string;
  passed: boolean;
}

const strengthCopy = ['Weak', 'Fair', 'Good', 'Strong'];

export function getPasswordRules(value: string): PasswordRule[] {
  return [
    { key: 'length', label: 'At least 8 characters', passed: value.length >= 8 },
    { key: 'upper', label: 'Contains uppercase letter', passed: /[A-Z]/.test(value) },
    { key: 'lower', label: 'Contains lowercase letter', passed: /[a-z]/.test(value) },
    { key: 'number', label: 'Contains number', passed: /\d/.test(value) },
    { key: 'special', label: 'Contains special character', passed: /[^A-Za-z0-9]/.test(value) },
  ];
}

export function getPasswordStrength(value: string): number {
  const passed = getPasswordRules(value).filter((rule) => rule.passed).length;
  return Math.min(3, Math.max(0, passed - 2));
}

export function PasswordInput({
  label = 'Password',
  value,
  onChange,
  hint,
  error,
  disabled = false,
}: PasswordInputProps) {
  const [show, setShow] = useState(false);
  const rules = useMemo(() => getPasswordRules(value), [value]);
  const strength = useMemo(() => getPasswordStrength(value), [value]);

  return (
    <div className="space-y-2">
      <Input
        type={show ? 'text' : 'password'}
        label={label}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Create a strong password"
        rightIcon={
          <button
            type="button"
            className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            onClick={() => setShow((prev) => !prev)}
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
        hint={hint}
        error={error}
      />

      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-700">Strength</p>
          <p className="text-xs font-semibold text-primary-700">{strengthCopy[strength]}</p>
        </div>
        <div className="mb-3 h-2 rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary-300 via-primary-500 to-primary-700 transition-all"
            style={{ width: `${((strength + 1) / 4) * 100}%` }}
          />
        </div>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {rules.map((rule) => (
            <div key={rule.key} className="flex items-center gap-1.5 text-xs">
              {rule.passed ? (
                <CheckCircle2 size={14} className="text-primary-600" />
              ) : (
                <XCircle size={14} className="text-slate-400" />
              )}
              <span className={rule.passed ? 'font-medium text-primary-700' : 'text-slate-500'}>{rule.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ConfirmPasswordInput({
  label = 'Confirm Password',
  password,
  confirmPassword,
  onChange,
  error,
  disabled = false,
}: ConfirmPasswordInputProps) {
  const [show, setShow] = useState(false);
  const hasValue = confirmPassword.length > 0;
  const matches = hasValue && password === confirmPassword;

  return (
    <Input
      type={show ? 'text' : 'password'}
      label={label}
      value={confirmPassword}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Retype your password"
      rightIcon={
        <button
          type="button"
          className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          onClick={() => setShow((prev) => !prev)}
          aria-label={show ? 'Hide password confirmation' : 'Show password confirmation'}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      }
      hint={
        !hasValue
          ? 'Re-enter your password to confirm.'
          : matches
          ? 'Passwords match.'
          : 'Passwords do not match.'
      }
      error={error || (hasValue && !matches ? 'Passwords do not match.' : undefined)}
    />
  );
}
