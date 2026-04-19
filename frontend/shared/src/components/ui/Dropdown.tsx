'use client';

import { Check, ChevronDown } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  error?: string;
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
  error,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [menuMaxHeight, setMenuMaxHeight] = useState(320);
  const debouncedQuery = useDebouncedValue(query, debounceMs);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useOutsideClick(wrapperRef, () => setIsOpen(false));

  const updateMenuMaxHeight = useCallback(() => {
    if (!wrapperRef.current) {
      return;
    }

    const triggerRect = wrapperRef.current.getBoundingClientRect();
    let clipTop = 0;
    let clipBottom = window.innerHeight;

    let ancestor: HTMLElement | null = wrapperRef.current.parentElement;
    while (ancestor) {
      const style = window.getComputedStyle(ancestor);
      const overflowSignature = `${style.overflow} ${style.overflowY} ${style.overflowX}`;
      if (/(auto|scroll|hidden|clip)/.test(overflowSignature)) {
        const rect = ancestor.getBoundingClientRect();
        clipTop = Math.max(clipTop, rect.top);
        clipBottom = Math.min(clipBottom, rect.bottom);
      }
      ancestor = ancestor.parentElement;
    }

    const margin = 10;
    const availableBelow = Math.max(0, clipBottom - triggerRect.bottom - margin);
    const availableAbove = Math.max(0, triggerRect.top - clipTop - margin);

    // Preserve normal dropdown behavior (open below), only fallback above when below has no space.
    const boundedHeight = availableBelow > 0 ? availableBelow : availableAbove;
    setMenuMaxHeight(Math.min(380, boundedHeight));
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    updateMenuMaxHeight();

    const onLayoutChange = () => updateMenuMaxHeight();
    window.addEventListener('resize', onLayoutChange);
    window.addEventListener('scroll', onLayoutChange, true);

    return () => {
      window.removeEventListener('resize', onLayoutChange);
      window.removeEventListener('scroll', onLayoutChange, true);
    };
  }, [isOpen, updateMenuMaxHeight]);

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
      {label ? <label className={cn('text-sm font-semibold', error ? 'text-red-700' : 'text-slate-700')}>{label}</label> : null}
      <button
        type="button"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'flex h-11 w-full items-center justify-between rounded-xl border px-3.5 text-sm transition-all',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/20',
          disabled
            ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
            : error
            ? 'border-red-300 bg-red-50 text-red-900 shadow-sm hover:border-red-400'
            : 'border-slate-300 bg-white text-slate-700 shadow-sm hover:border-slate-400',
        )}
      >
        <span className={cn('truncate text-left', selected ? 'text-slate-900' : 'text-slate-400')}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown size={16} className={cn('text-slate-400 transition-transform', isOpen ? 'rotate-180' : '')} />
      </button>

      {isOpen ? (
        <div
          className="absolute left-0 right-0 z-50 mt-2 flex w-full max-w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-900/10"
          style={{ maxHeight: `${menuMaxHeight}px` }}
        >
          {canSearch ? (
            <SearchBar value={query} onChange={setQuery} placeholder="Search option..." className="max-w-none" />
          ) : null}
          <div className="mt-2 min-h-0 overflow-auto overscroll-contain">
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
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}
