'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="transition-all duration-300 ml-[260px]">
        <TopBar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
