'use client';

import { Bell, Menu, Search, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TopBarProps {
  initials: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onMobileMenuClick?: () => void;
}

export function TopBar({ initials, searchValue, onSearchChange, onMobileMenuClick }: TopBarProps) {
  const [internalSearchValue, setInternalSearchValue] = useState(searchValue ?? '');

  useEffect(() => {
    if (typeof searchValue === 'string') {
      setInternalSearchValue(searchValue);
    }
  }, [searchValue]);

  const value = typeof searchValue === 'string' ? searchValue : internalSearchValue;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
      <div className="flex flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onMobileMenuClick}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
        >
          <Menu size={18} />
        </button>

        <div className="relative w-full max-w-md">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={value}
            onChange={(event) => {
              const nextValue = event.target.value;
              setInternalSearchValue(nextValue);
              onSearchChange?.(nextValue);
            }}
            placeholder="Search anything..."
            className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/10"
          />
          <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-400 sm:inline-flex">
            Ctrl+K
          </kbd>
        </div>
      </div>

      <div className="ml-3 flex items-center gap-1.5 sm:gap-2">
        <button type="button" className="relative rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary-500" />
        </button>
        <button type="button" className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
          <Settings size={18} />
        </button>
        <div className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white">
          {initials}
        </div>
      </div>
    </header>
  );
}
