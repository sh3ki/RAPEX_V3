'use client';

import { LayoutDashboard, Users, Store, Bike, ShoppingCart, BarChart3, Bell, Shield, Gift, MessageSquare } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sidebar as SharedSidebar, type SidebarSection } from '@shared/components/layout';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

interface SidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const sections: SidebarSection[] = [
  {
    title: 'OVERVIEW',
    items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'MANAGEMENT',
    items: [
      { href: '/users', label: 'Users', icon: Users },
      { href: '/merchants', label: 'Merchants', icon: Store },
      { href: '/riders', label: 'Riders', icon: Bike },
    ],
  },
  {
    title: 'COMMERCE',
    items: [
      { href: '/orders', label: 'Orders', icon: ShoppingCart },
      { href: '/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    title: 'COMMUNICATIONS',
    items: [
      { href: '/notifications', label: 'Notifications', icon: Bell },
      { href: '/chat', label: 'Chat', icon: MessageSquare },
    ],
  },
  {
    title: 'SECURITY',
    items: [
      { href: '/fraud', label: 'Fraud', icon: Shield },
      { href: '/referrals', label: 'Referrals', icon: Gift },
    ],
  },
];

export default function Sidebar({ collapsed: collapsedProp, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname();
  const { logout, user } = useAuthStore();
  const [localCollapsed, setLocalCollapsed] = useState(false);

  const { data: merchants = [] } = useQuery<Array<{ kyc_status: string }>>({
    queryKey: ['admin-merchants'],
    queryFn: () => api.get('/admin/merchants/').then((response) => response.data),
    refetchInterval: 30_000,
  });

  const pendingMerchantKycCount = merchants.filter(
    (merchant) => String(merchant.kyc_status || '').toUpperCase() === 'PENDING',
  ).length;

  const sectionsWithCounts: SidebarSection[] = sections.map((section) => ({
    ...section,
    items: section.items.map((item) => (
      item.href === '/merchants'
        ? { ...item, badgeCount: pendingMerchantKycCount }
        : item
    )),
  }));

  const collapsed = collapsedProp ?? localCollapsed;
  const setCollapsed = onCollapsedChange ?? setLocalCollapsed;

  return (
    <SharedSidebar
      sections={sectionsWithCounts}
      activePath={pathname}
      collapsed={collapsed}
      onCollapsedChange={setCollapsed}
      roleLabel="ADMIN PANEL"
      userName={user?.email?.split('@')[0] || 'Admin'}
      userMeta="Admin"
      userInitial={user?.email?.[0]?.toUpperCase() || 'A'}
      onLogout={logout}
    />
  );
}
