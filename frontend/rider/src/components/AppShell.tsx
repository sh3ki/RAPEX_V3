'use client';
import { useAuthStore } from '@/store/authStore';
import BottomNav from '@/components/BottomNav';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

export default function AppShell({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = pathname === '/login';

  useEffect(() => { if (!isAuthenticated && !isPublic) router.replace('/login'); }, [isAuthenticated, isPublic, router]);

  if (!isAuthenticated && !isPublic) return null;

  return (
    <div className="min-h-screen max-w-lg mx-auto relative">
      <main className={`${!isPublic ? 'pb-20' : ''}`}>{children}</main>
      {!isPublic && <BottomNav />}
    </div>
  );
}
