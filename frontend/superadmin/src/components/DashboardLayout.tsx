'use client';

import { DashboardShell } from '@shared/components/layout';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardShell
      sidebarCollapsed={sidebarCollapsed}
      sidebar={<Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />}
      topbar={<TopBar />}
    >
      {children}
    </DashboardShell>
  );
}
