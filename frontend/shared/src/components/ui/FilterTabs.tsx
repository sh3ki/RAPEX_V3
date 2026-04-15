'use client';

import type { TabOption } from '../../types';
import { cn } from '../../utils/cn';

interface FilterTabsProps {
  tabs: TabOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function FilterTabs({ tabs, value, onChange, className }: FilterTabsProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'border-primary-200 bg-primary-50 text-primary-700'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
            )}
          >
            {tab.label}
            {typeof tab.count === 'number' ? (
              <span className="ml-2 rounded-full bg-white px-1.5 py-0.5 text-xs text-gray-500">{tab.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
