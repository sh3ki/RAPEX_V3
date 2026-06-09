'use client';

import { cn } from '../../utils/cn';

interface DashboardShellProps {
  sidebar: React.ReactNode;
  topbar: React.ReactNode;
  children: React.ReactNode;
  sidebarCollapsed: boolean;
  className?: string;
}

export function DashboardShell({
  sidebar,
  topbar,
  children,
  sidebarCollapsed,
  className,
}: DashboardShellProps) {
  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      {sidebar}
      <div className={cn('transition-all duration-300', sidebarCollapsed ? 'ml-0 lg:ml-[70px]' : 'ml-0 lg:ml-[260px]')}>
        {topbar}
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
