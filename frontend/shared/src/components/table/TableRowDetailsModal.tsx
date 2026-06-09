'use client';

import { X } from 'lucide-react';

interface TableRowDetailsModalProps {
  open: boolean;
  title: string;
  rows: Array<{ label: string; value: string }>;
  onClose: () => void;
}

export function TableRowDetailsModal({ open, title, rows, onClose }: TableRowDetailsModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-xl rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[70vh] space-y-3 overflow-y-auto px-5 py-4">
          {rows.map((row) => (
            <div key={row.label} className="grid grid-cols-[170px_1fr] gap-3 border-b border-gray-100 pb-2 text-sm">
              <p className="text-gray-500">{row.label}</p>
              <p className="break-words text-gray-900">{row.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
