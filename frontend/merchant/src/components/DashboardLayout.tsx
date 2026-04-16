'use client';

import { DashboardShell } from '@shared/components/layout';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (String(user?.role || '').toUpperCase() === 'MERCHANT') {
      const status = String(user?.status || '').toUpperCase();
      if (!user?.wizard_completed) {
        router.replace('/onboarding');
        return;
      }

      if (status === 'PENDING') {
        router.replace('/pending');
      }
    }
  }, [isAuthenticated, router, user?.role, user?.status, user?.wizard_completed]);

  if (!isAuthenticated) {
    return null;
  }

  if (String(user?.role || '').toUpperCase() === 'MERCHANT') {
    if (!user?.wizard_completed || String(user?.status || '').toUpperCase() === 'PENDING') {
      return null;
    }
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
