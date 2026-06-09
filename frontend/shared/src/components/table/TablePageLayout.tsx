'use client';

import { type ReactNode } from 'react';
import type { BreadcrumbItem } from '../../types';
import { Breadcrumb } from '../ui/Breadcrumb';
import { PageTitle } from '../ui/PageTitle';

interface TablePageLayoutProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actionSlot?: ReactNode;
  children: ReactNode;
}

export function TablePageLayout({
  title,
  subtitle,
  breadcrumbs,
  actionSlot,
  children,
}: TablePageLayoutProps) {
  return (
    <section className="space-y-4">
      {breadcrumbs && breadcrumbs.length ? <Breadcrumb items={breadcrumbs} /> : null}
      <PageTitle title={title} subtitle={subtitle} rightSlot={actionSlot} />
      {children}
    </section>
  );
}
