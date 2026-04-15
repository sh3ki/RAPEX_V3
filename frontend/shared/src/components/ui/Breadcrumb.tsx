'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { BreadcrumbItem } from '../../types';

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={`${item.label}-${index}`} className="flex items-center gap-1">
            {item.href && !isLast ? (
              <Link href={item.href} className="text-gray-500 hover:text-primary-600 transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'font-medium text-gray-800' : 'text-gray-500'}>{item.label}</span>
            )}
            {!isLast && <ChevronRight size={14} className="text-gray-400" />}
          </div>
        );
      })}
    </nav>
  );
}
