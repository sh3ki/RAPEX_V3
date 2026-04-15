'use client';

import { Check, ChevronDown } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useOutsideClick } from '../../hooks/useOutsideClick';
import type { SelectOption } from '../../types';
import { cn } from '../../utils/cn';
import { SearchBar } from './SearchBar';

interface DropdownProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  searchThreshold?: number;
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  label,
  searchThreshold = 7,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  useOutsideClick(wrapperRef, () => setIsOpen(false));

  const selected = options.find((item) => item.value === value);
  const canSearch = options.length >= searchThreshold;

  const filteredOptions = useMemo(() => {
    if (!query.trim()) {
      return options;
    }

    const q = query.toLowerCase();
    return options.filter((option) => `${option.label} ${option.description ?? ''}`.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <div className="relative space-y-1.5" ref={wrapperRef}>
      {label ? <label className="text-sm font-medium text-gray-700">{label}</label> : null}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
      >
        <span className={cn('truncate text-left', selected ? 'text-gray-900' : 'text-gray-400')}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown size={16} className={cn('text-gray-400 transition-transform', isOpen ? 'rotate-180' : '')} />
      </button>

      {isOpen ? (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white p-2 shadow-xl">
          {canSearch ? (
            <SearchBar value={query} onChange={setQuery} placeholder="Search option..." className="max-w-none" />
          ) : null}
          <div className="mt-2 max-h-60 overflow-auto">
            {filteredOptions.length ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  <div>
                    <p className="font-medium text-gray-800">{option.label}</p>
                    {option.description ? <p className="text-xs text-gray-500">{option.description}</p> : null}
                  </div>
                  {value === option.value ? <Check size={16} className="text-primary-600" /> : null}
                </button>
              ))
            ) : (
              <p className="px-2.5 py-4 text-sm text-gray-500">No option found.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
