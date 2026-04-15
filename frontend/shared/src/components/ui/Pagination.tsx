'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  rowsPerPage: number;
  rowsPerPageOptions?: number[];
  totalItems: number;
  showingFrom: number;
  showingTo: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
}

export function Pagination({
  page,
  totalPages,
  rowsPerPage,
  rowsPerPageOptions = [10, 20, 50, 100],
  totalItems,
  showingFrom,
  showingTo,
  onPageChange,
  onRowsPerPageChange,
}: PaginationProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 text-sm text-gray-600">
      <p>
        Showing {showingFrom}-{showingTo} of {totalItems} results
      </p>
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-500">Rows</label>
        <select
          value={rowsPerPage}
          onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
          className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm"
        >
          {rowsPerPageOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="inline-flex h-9 items-center gap-1 rounded-md border border-gray-300 bg-white px-3 disabled:opacity-50"
        >
          <ChevronLeft size={14} />
          Previous
        </button>
        <span className="min-w-16 text-center text-sm text-gray-700">
          {page} / {Math.max(totalPages, 1)}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="inline-flex h-9 items-center gap-1 rounded-md border border-gray-300 bg-white px-3 disabled:opacity-50"
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
