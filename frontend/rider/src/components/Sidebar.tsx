'use client';

import { LayoutDashboard, ShoppingCart, Wallet, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Sidebar as SharedSidebar, type SidebarSection } from '@shared/components/layout';
import { useAuthStore } from '@/store/authStore';

interface SidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const sections: SidebarSection[] = [
  {
    title: 'OVERVIEW',
    items: [{ href: '/orders', label: 'Home', icon: LayoutDashboard }],
  },
  {
    title: 'DELIVERIES',
    items: [{ href: '/orders', label: 'Orders', icon: ShoppingCart }],
  },
  {
    title: 'FINANCE',
    items: [{ href: '/wallet', label: 'Wallet', icon: Wallet }],
  },
  {
    title: 'ACCOUNT',
    items: [{ href: '/profile', label: 'Profile', icon: User }],
  },
];

export default function Sidebar({ collapsed: collapsedProp, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname();
  const { logout, user } = useAuthStore();
  const [localCollapsed, setLocalCollapsed] = useState(false);

  const collapsed = collapsedProp ?? localCollapsed;
  const setCollapsed = onCollapsedChange ?? setLocalCollapsed;

  return (
    <SharedSidebar
      sections={sections}
      activePath={pathname}
      collapsed={collapsed}
      onCollapsedChange={setCollapsed}
      roleLabel="RIDER"
      userName={user?.email?.split('@')[0] || 'Rider'}
      userMeta="Rider"
      userInitial={user?.email?.[0]?.toUpperCase() || 'R'}
      onLogout={logout}
    />
  );
}
