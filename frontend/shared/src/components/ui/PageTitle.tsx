'use client';

import { type ReactNode } from 'react';

interface PageTitleProps {
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
}

export function PageTitle({ title, subtitle, rightSlot }: PageTitleProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
      </div>
      {rightSlot}
    </div>
  );
}
