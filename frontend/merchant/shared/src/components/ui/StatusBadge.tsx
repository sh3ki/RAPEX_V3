'use client';

import { cn } from '../../utils/cn';

interface StatusBadgeProps {
  status: string;
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  SUCCESS: 'bg-emerald-50 text-emerald-700',
  PENDING: 'bg-amber-50 text-amber-700',
  PROCESSING: 'bg-blue-50 text-blue-700',
  INFO: 'bg-blue-50 text-blue-700',
  INACTIVE: 'bg-gray-100 text-gray-600',
  DRAFT: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-50 text-red-700',
  REJECTED: 'bg-red-50 text-red-700',
  FAILED: 'bg-red-50 text-red-700',
};

function formatLabel(status: string): string {
  return status
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toUpperCase();
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
        STATUS_STYLES[normalized] || 'bg-gray-100 text-gray-700',
      )}
    >
      {formatLabel(normalized)}
    </span>
  );
}
