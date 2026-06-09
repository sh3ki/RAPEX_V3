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
  const safeTotalPages = Math.max(totalPages, 1);
  const startPage = Math.max(1, page - 1);
  const endPage = Math.min(safeTotalPages, startPage + 2);
  const normalizedStart = Math.max(1, endPage - 2);
  const visiblePages = [];

  for (let cursor = normalizedStart; cursor <= endPage; cursor += 1) {
    visiblePages.push(cursor);
  }

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

        {visiblePages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => onPageChange(pageNumber)}
            className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-sm ${
              pageNumber === page
                ? 'border-primary-500 bg-primary-500 text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {pageNumber}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(safeTotalPages, page + 1))}
          disabled={page >= safeTotalPages}
          className="inline-flex h-9 items-center gap-1 rounded-md border border-gray-300 bg-white px-3 disabled:opacity-50"
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
