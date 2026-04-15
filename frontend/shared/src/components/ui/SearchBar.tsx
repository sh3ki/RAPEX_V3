'use client';

import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { cn } from '../../utils/cn';

interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  onDebouncedChange?: (value: string) => void;
  debounceMs?: number;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  onDebouncedChange,
  debounceMs = 250,
  placeholder = 'Search...',
  className,
}: SearchBarProps) {
  const [internal, setInternal] = useState(value ?? '');
  const debounced = useDebouncedValue(internal, debounceMs);

  useEffect(() => {
    if (typeof value === 'string') {
      setInternal(value);
    }
  }, [value]);

  useEffect(() => {
    onDebouncedChange?.(debounced);
  }, [debounced, onDebouncedChange]);

  return (
    <div className={cn('relative w-full max-w-md', className)}>
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        value={internal}
        onChange={(event) => {
          const nextValue = event.target.value;
          setInternal(nextValue);
          onChange?.(nextValue);
        }}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-9 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
      />
      {internal ? (
        <button
          type="button"
          onClick={() => {
            setInternal('');
            onChange?.('');
            onDebouncedChange?.('');
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      ) : null}
    </div>
  );
}
