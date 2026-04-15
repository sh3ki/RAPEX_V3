'use client';

import { Check, ChevronDown, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useOutsideClick } from '../../hooks/useOutsideClick';
import type { SelectOption } from '../../types';
import { SearchBar } from './SearchBar';

interface MultiSelectDropdownProps {
  options: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
  searchThreshold?: number;
}

export function MultiSelectDropdown({
  options,
  value,
  onChange,
  placeholder = 'Select options...',
  label,
  searchThreshold = 7,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  useOutsideClick(wrapperRef, () => setIsOpen(false));

  const canSearch = options.length >= searchThreshold;
  const selectedOptions = useMemo(() => options.filter((item) => value.includes(item.value)), [options, value]);

  const filteredOptions = useMemo(() => {
    if (!query.trim()) {
      return options;
    }

    const q = query.toLowerCase();
    return options.filter((option) => `${option.label} ${option.description ?? ''}`.toLowerCase().includes(q));
  }, [options, query]);

  function toggleOption(optionValue: string): void {
    if (value.includes(optionValue)) {
      onChange(value.filter((entry) => entry !== optionValue));
      return;
    }
    onChange([...value, optionValue]);
  }

  return (
    <div className="relative space-y-1.5" ref={wrapperRef}>
      {label ? <label className="text-sm font-medium text-gray-700">{label}</label> : null}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex min-h-10 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
      >
        <div className="flex flex-wrap gap-1.5">
          {selectedOptions.length ? (
            selectedOptions.map((item) => (
              <span
                key={item.value}
                className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700"
              >
                {item.label}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleOption(item.value);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      toggleOption(item.value);
                    }
                  }}
                >
                  <X size={12} />
                </span>
              </span>
            ))
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown size={16} className="text-gray-400" />
      </button>

      {isOpen ? (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white p-2 shadow-xl">
          {canSearch ? (
            <SearchBar value={query} onChange={setQuery} placeholder="Search option..." className="max-w-none" />
          ) : null}
          <div className="mt-2 max-h-60 overflow-auto">
            {filteredOptions.length ? (
              filteredOptions.map((option) => {
                const checked = value.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleOption(option.value)}
                    className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <div>
                      <p className="font-medium text-gray-800">{option.label}</p>
                      {option.description ? <p className="text-xs text-gray-500">{option.description}</p> : null}
                    </div>
                    {checked ? <Check size={16} className="text-primary-600" /> : null}
                  </button>
                );
              })
            ) : (
              <p className="px-2.5 py-4 text-sm text-gray-500">No option found.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
