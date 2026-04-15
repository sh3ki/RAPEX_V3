'use client';

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import type { ActionMenuItem, TabOption } from '../../types';
import { cn } from '../../utils/cn';
import { ActionMenu } from '../ui/ActionMenu';
import { ColumnsToggleButton } from '../ui/ColumnsToggleButton';
import { ExportButton } from '../ui/ExportButton';
import { FilterTabs } from '../ui/FilterTabs';
import { Pagination } from '../ui/Pagination';
import { SearchBar } from '../ui/SearchBar';

export interface TableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  searchable?: boolean;
  visible?: boolean;
  headerClassName?: string;
  cellClassName?: string;
  render?: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  exportValue?: (row: T) => string | number;
}

interface DataTableProps<T extends object> {
  columns: TableColumn<T>[];
  data: T[];
  rowKey?: keyof T | ((row: T, index: number) => string);
  title?: string;
  subtitle?: string;
  loading?: boolean;
  searchPlaceholder?: string;
  rowsPerPageOptions?: number[];
  defaultRowsPerPage?: number;
  tabs?: TabOption[];
  activeTab?: string;
  onTabChange?: (value: string) => void;
  filterByTab?: (row: T, tab: string) => boolean;
  getRowActions?: (row: T) => ActionMenuItem[];
  selectable?: boolean;
  className?: string;
}

interface SortState {
  key: string;
  direction: 'asc' | 'desc';
}

function getRawValue<T extends object>(row: T, key: string): unknown {
  return (row as Record<string, unknown>)[key];
}

function toComparable(value: unknown): string | number {
  if (typeof value === 'number') {
    return value;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  return String(value ?? '').toLowerCase();
}

function matchesQuery(source: string, query: string): boolean {
  if (!query.trim()) {
    return true;
  }

  const queryParts = query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  const normalizedSource = source.toLowerCase();
  return queryParts.every((part) => normalizedSource.includes(part));
}

export function DataTable<T extends object>({
  columns,
  data,
  rowKey,
  title,
  subtitle,
  loading = false,
  searchPlaceholder = 'Search...',
  rowsPerPageOptions = [10, 20, 50, 100],
  defaultRowsPerPage = 10,
  tabs,
  activeTab = 'all',
  onTabChange,
  filterByTab,
  getRowActions,
  selectable = true,
  className,
}: DataTableProps<T>) {
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [sort, setSort] = useState<SortState | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [visibleMap, setVisibleMap] = useState<Record<string, boolean>>(() => {
    return columns.reduce<Record<string, boolean>>((acc, column) => {
      acc[column.key] = column.visible !== false;
      return acc;
    }, {});
  });

  const debouncedSearch = useDebouncedValue(searchText, 250);

  const visibleColumns = useMemo(() => columns.filter((column) => visibleMap[column.key] !== false), [columns, visibleMap]);

  const filteredRows = useMemo(() => {
    return data.filter((row) => {
      if (tabs && filterByTab && !filterByTab(row, activeTab)) {
        return false;
      }

      if (!debouncedSearch.trim()) {
        return true;
      }

      const searchSource = columns
        .filter((column) => column.searchable !== false)
        .map((column) => {
          const raw = column.exportValue ? column.exportValue(row) : getRawValue(row, column.key);
          return String(raw ?? '');
        })
        .join(' ');

      return matchesQuery(searchSource, debouncedSearch);
    });
  }, [activeTab, columns, data, debouncedSearch, filterByTab, tabs]);

  const sortedRows = useMemo(() => {
    if (!sort) {
      return filteredRows;
    }

    const targetColumn = columns.find((column) => column.key === sort.key);
    if (!targetColumn) {
      return filteredRows;
    }

    const sorted = [...filteredRows].sort((a, b) => {
      const aValue = targetColumn.sortValue ? targetColumn.sortValue(a) : getRawValue(a, targetColumn.key);
      const bValue = targetColumn.sortValue ? targetColumn.sortValue(b) : getRawValue(b, targetColumn.key);
      const comparableA = toComparable(aValue);
      const comparableB = toComparable(bValue);

      if (comparableA < comparableB) {
        return sort.direction === 'asc' ? -1 : 1;
      }
      if (comparableA > comparableB) {
        return sort.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }, [columns, filteredRows, sort]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);

  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return sortedRows.slice(start, end);
  }, [safePage, rowsPerPage, sortedRows]);

  function getRowId(row: T, index: number): string {
    if (typeof rowKey === 'function') {
      return rowKey(row, index);
    }

    if (rowKey) {
      return String(row[rowKey]);
    }

    const fallback = getRawValue(row, 'id');
    return fallback ? String(fallback) : String(index);
  }

  function toggleSort(columnKey: string): void {
    setSort((current) => {
      if (!current || current.key !== columnKey) {
        return { key: columnKey, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key: columnKey, direction: 'desc' };
      }
      return null;
    });
  }

  function toggleRow(rowId: string): void {
    setSelectedRowIds((current) => {
      const next = new Set(current);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  }

  function toggleAllVisibleRows(checked: boolean): void {
    if (!checked) {
      setSelectedRowIds(new Set());
      return;
    }

    const next = new Set<string>();
    paginatedRows.forEach((row, index) => next.add(getRowId(row, index)));
    setSelectedRowIds(next);
  }

  function exportVisibleRowsToCsv(): void {
    const headers = visibleColumns.map((column) => column.label);
    const rows = paginatedRows.map((row) => {
      return visibleColumns.map((column) => {
        const value = column.exportValue ? column.exportValue(row) : getRawValue(row, column.key);
        const normalized = String(value ?? '').replaceAll('"', '""');
        return `"${normalized}"`;
      });
    });

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'table-export.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={cn('overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm', className)}>
      {(title || subtitle) ? (
        <div className="border-b border-gray-200 px-5 py-4">
          {title ? <h3 className="text-base font-semibold text-gray-900">{title}</h3> : null}
          {subtitle ? <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p> : null}
        </div>
      ) : null}

      <div className="space-y-3 border-b border-gray-200 px-4 py-3">
        {tabs && tabs.length ? <FilterTabs tabs={tabs} value={activeTab} onChange={(tab) => onTabChange?.(tab)} /> : null}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SearchBar
            value={searchText}
            onChange={(next) => {
              setSearchText(next);
              setPage(1);
            }}
            placeholder={searchPlaceholder}
          />
          <div className="flex items-center gap-2">
            <ColumnsToggleButton
              columns={columns.map((column) => ({
                key: column.key,
                label: column.label,
                checked: visibleMap[column.key] !== false,
              }))}
              onChange={(key, checked) => {
                setVisibleMap((prev) => ({ ...prev, [key]: checked }));
              }}
            />
            <ExportButton onExport={exportVisibleRowsToCsv} />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/80">
              {selectable ? (
                <th className="w-10 px-3 py-2.5 text-left">
                  <input
                    type="checkbox"
                    checked={paginatedRows.length > 0 && paginatedRows.every((row, index) => selectedRowIds.has(getRowId(row, index)))}
                    onChange={(event) => toggleAllVisibleRows(event.target.checked)}
                    className="accent-primary-500"
                  />
                </th>
              ) : null}
              {visibleColumns.map((column) => {
                const sortable = column.sortable !== false;
                const isSorted = sort?.key === column.key;
                const icon = !sortable ? null : isSorted ? (sort?.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} />;

                return (
                  <th
                    key={column.key}
                    className={cn('px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500', column.headerClassName)}
                  >
                    <button
                      type="button"
                      onClick={() => (sortable ? toggleSort(column.key) : undefined)}
                      className={cn('inline-flex items-center gap-1', sortable ? 'hover:text-gray-700' : 'cursor-default')}
                    >
                      {column.label}
                      {icon}
                    </button>
                  </th>
                );
              })}
              {getRowActions ? <th className="w-14 px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Action</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={visibleColumns.length + (selectable ? 1 : 0) + (getRowActions ? 1 : 0)} className="px-4 py-8 text-center text-sm text-gray-500">
                  Loading data...
                </td>
              </tr>
            ) : paginatedRows.length ? (
              paginatedRows.map((row, index) => {
                const rowId = getRowId(row, index);
                const rowActions = getRowActions?.(row) ?? [];

                return (
                  <tr key={rowId} className="hover:bg-gray-50/60">
                    {selectable ? (
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={selectedRowIds.has(rowId)}
                          onChange={() => toggleRow(rowId)}
                          className="accent-primary-500"
                        />
                      </td>
                    ) : null}
                    {visibleColumns.map((column) => (
                      <td key={column.key} className={cn('px-4 py-3 text-sm text-gray-700', column.cellClassName)}>
                        {column.render ? column.render(row) : String(getRawValue(row, column.key) ?? '-')}
                      </td>
                    ))}
                    {getRowActions ? (
                      <td className="px-4 py-2 text-right">
                        {rowActions.length ? <ActionMenu items={rowActions} /> : null}
                      </td>
                    ) : null}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={visibleColumns.length + (selectable ? 1 : 0) + (getRowActions ? 1 : 0)} className="px-4 py-8 text-center text-sm text-gray-500">
                  No data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={safePage}
        totalPages={totalPages}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={rowsPerPageOptions}
        totalItems={sortedRows.length}
        showingFrom={sortedRows.length ? (safePage - 1) * rowsPerPage + 1 : 0}
        showingTo={Math.min(safePage * rowsPerPage, sortedRows.length)}
        onPageChange={setPage}
        onRowsPerPageChange={(rows) => {
          setRowsPerPage(rows);
          setPage(1);
        }}
      />
    </div>
  );
}
