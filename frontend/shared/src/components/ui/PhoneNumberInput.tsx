'use client';

import type { SelectOption } from '../../types';

const COUNTRY_CODES: SelectOption[] = [
  { label: 'Philippines', value: '+63' },
  { label: 'United States', value: '+1' },
  { label: 'Singapore', value: '+65' },
  { label: 'Japan', value: '+81' },
  { label: 'United Kingdom', value: '+44' },
  { label: 'Australia', value: '+61' },
  { label: 'Canada', value: '+1-CA' },
];

interface PhoneNumberInputProps {
  label?: string;
  countryCode: string;
  phone: string;
  onCountryCodeChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
}

export function PhoneNumberInput({
  label,
  countryCode,
  phone,
  onCountryCodeChange,
  onPhoneChange,
}: PhoneNumberInputProps) {
  return (
    <div className="space-y-1.5">
      {label ? <label className="text-sm font-medium text-gray-700">{label}</label> : null}
      <div className="flex gap-2">
        <select
          value={countryCode}
          onChange={(event) => onCountryCodeChange(event.target.value)}
          className="h-10 rounded-lg border border-gray-300 bg-white px-2 text-sm text-gray-700"
        >
          {COUNTRY_CODES.map((country) => (
            <option key={country.value} value={country.value}>
              {country.value}
            </option>
          ))}
        </select>
        <input
          value={phone}
          onChange={(event) => onPhoneChange(event.target.value.replace(/[^0-9]/g, ''))}
          placeholder="9123456789"
          className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
      </div>
    </div>
  );
}
