'use client';

import { Columns3 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useOutsideClick } from '../../hooks/useOutsideClick';

export interface ColumnToggleItem {
  key: string;
  label: string;
  checked: boolean;
}

interface ColumnsToggleButtonProps {
  columns: ColumnToggleItem[];
  onChange: (key: string, checked: boolean) => void;
}

export function ColumnsToggleButton({ columns, onChange }: ColumnsToggleButtonProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  useOutsideClick(wrapperRef, () => setOpen(false));

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <Columns3 size={16} />
        Columns
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-1 min-w-52 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
          {columns.map((column) => (
            <label key={column.key} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-gray-700 hover:bg-gray-100">
              <input
                type="checkbox"
                checked={column.checked}
                onChange={(event) => onChange(column.key, event.target.checked)}
                className="accent-primary-500"
              />
              {column.label}
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}
