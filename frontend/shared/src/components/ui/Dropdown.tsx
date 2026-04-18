'use client';

import { Check, ChevronDown } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useOutsideClick } from '../../hooks/useOutsideClick';
import type { SelectOption } from '../../types';
import { cn } from '../../utils/cn';
import { fuzzyFilterAndSort } from '../../utils/fuzzySearch';
import { SearchBar } from './SearchBar';

interface DropdownProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  searchThreshold?: number;
  debounceMs?: number;
  fuzzySearch?: boolean;
  disabled?: boolean;
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  label,
  searchThreshold = 7,
  debounceMs = 180,
  fuzzySearch = true,
  disabled = false,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, debounceMs);
  const wrapperRef = useRef<HTMLDivElement>(null);
  useOutsideClick(wrapperRef, () => setIsOpen(false));

  const selected = options.find((item) => item.value === value);
  const canSearch = options.length >= searchThreshold;

  const filteredOptions = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return options;
    }

    if (fuzzySearch) {
      return fuzzyFilterAndSort(
        options,
        debouncedQuery,
        (option) => `${option.label} ${option.description ?? ''}`,
      );
    }

    const q = debouncedQuery.toLowerCase();
    return options.filter((option) => `${option.label} ${option.description ?? ''}`.toLowerCase().includes(q));
  }, [debouncedQuery, fuzzySearch, options]);

  return (
    <div className="relative space-y-1.5" ref={wrapperRef}>
      {label ? <label className="text-sm font-semibold text-slate-700">{label}</label> : null}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'flex h-11 w-full items-center justify-between rounded-xl border px-3.5 text-sm transition-all',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/20',
          disabled
            ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
            : 'border-slate-300 bg-white text-slate-700 shadow-sm hover:border-slate-400',
        )}
      >
        <span className={cn('truncate text-left', selected ? 'text-slate-900' : 'text-slate-400')}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown size={16} className={cn('text-slate-400 transition-transform', isOpen ? 'rotate-180' : '')} />
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 z-[80] mt-2 w-full max-w-full rounded-xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/10">
          {canSearch ? (
            <SearchBar value={query} onChange={setQuery} placeholder="Search option..." className="max-w-none" />
          ) : null}
          <div className="mt-2 max-h-[min(16rem,40vh)] overflow-auto overscroll-contain">
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
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{option.label}</p>
                    {option.description ? <p className="text-xs text-slate-500">{option.description}</p> : null}
                  </div>
                  {value === option.value ? <Check size={16} className="text-primary-600" /> : null}
                </button>
              ))
            ) : (
              <p className="px-2.5 py-4 text-sm text-slate-500">No option found.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
