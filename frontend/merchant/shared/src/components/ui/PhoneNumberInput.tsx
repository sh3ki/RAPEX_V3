'use client';

import { useMemo } from 'react';
import type { SelectOption } from '../../types';
import { cn } from '../../utils/cn';
import { Dropdown } from './Dropdown';

interface PhoneCountryOption {
  label: string;
  value: string;
  countryName?: string;
  flag?: string;
  shortCode?: string;
  maxDigits?: number;
  isDefault?: boolean;
}

const COUNTRY_CODES: PhoneCountryOption[] = [
  {
    label: 'PH (+63)',
    value: '+63',
    countryName: 'Philippines',
    flag: 'PH',
    maxDigits: 10,
    isDefault: true,
  },
  { label: 'US (+1)', value: '+1', countryName: 'United States', flag: 'US', maxDigits: 10 },
  { label: 'SG (+65)', value: '+65', countryName: 'Singapore', flag: 'SG', maxDigits: 8 },
];

interface PhoneNumberInputProps {
  label?: string;
  countryCode: string;
  phone: string;
  onCountryCodeChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  countries?: PhoneCountryOption[];
  hint?: string;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
}

function toShortCode(option: PhoneCountryOption): string {
  const explicit = (option.shortCode || '').trim().toUpperCase();
  if (explicit) {
    return explicit;
  }

  const flagCode = (option.flag || '').trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(flagCode)) {
    return flagCode;
  }

  const countryName = (option.countryName || option.label || '').trim();
  if (!countryName) {
    return 'NA';
  }

  const words = countryName.match(/[A-Za-z]+/g) || [];
  if (words.length >= 2) {
    const firstWord = words[0] || '';
    const secondWord = words[1] || '';
    return `${firstWord.charAt(0)}${secondWord.charAt(0)}`.toUpperCase();
  }
  const firstWord = words[0] || '';
  return firstWord.slice(0, 2).toUpperCase();
}

export function PhoneNumberInput({
  label,
  countryCode,
  phone,
  onCountryCodeChange,
  onPhoneChange,
  countries,
  hint,
  error,
  placeholder = '9123456789',
  disabled = false,
}: PhoneNumberInputProps) {
  const options = useMemo(() => {
    const fromProps = (countries && countries.length ? countries : COUNTRY_CODES).map((option) => ({
      ...option,
      maxDigits: option.maxDigits ?? 15,
      countryName: option.countryName || option.label,
      flag: option.flag || '',
      shortCode: option.shortCode || '',
    }));

    const sorted = [...fromProps].sort((a, b) => {
      if (a.isDefault && !b.isDefault) {
        return -1;
      }
      if (!a.isDefault && b.isDefault) {
        return 1;
      }
      return a.label.localeCompare(b.label);
    });

    return sorted;
  }, [countries]);

  const selectedCountry = options.find((option) => option.value === countryCode) || options[0];
  const maxDigits = selectedCountry?.maxDigits ?? 15;

  const dropdownOptions = useMemo<SelectOption[]>(() => {
    return options.map((country) => {
      const shortCode = toShortCode(country);
      return {
        value: country.value,
        label: `${shortCode} (${country.value})`,
      };
    });
  }, [options]);

  return (
    <div className="space-y-1.5">
      {label ? <label className="text-sm font-semibold text-slate-700">{label}</label> : null}
      <div className="flex items-start gap-2">
        <div className="min-w-[11.25rem] max-w-[11.25rem]">
          <Dropdown
            options={dropdownOptions}
            value={countryCode}
            onChange={onCountryCodeChange}
            disabled={disabled}
            error={error}
            searchThreshold={6}
            placeholder="Country code"
          />
        </div>
        <input
          disabled={disabled}
          value={phone}
          maxLength={maxDigits}
          onChange={(event) => onPhoneChange(event.target.value.replace(/[^0-9]/g, '').slice(0, maxDigits))}
          placeholder={placeholder}
          className={cn(
            'h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm',
            'placeholder:text-slate-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
            error ? 'border-red-300 text-red-900' : 'border-slate-300 text-slate-900',
            disabled ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400' : '',
          )}
        />
      </div>
      {error ? (
        <p className="text-xs font-medium text-red-600">{error}</p>
      ) : (
        <p className="text-xs text-slate-500">{hint || `Maximum ${maxDigits} digits for ${selectedCountry?.countryName || 'selected country'}.`}</p>
      )}
    </div>
  );
}
