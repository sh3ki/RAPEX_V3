'use client';

import { LayoutDashboard, Store, Package, ShoppingCart, Settings } from 'lucide-react';
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
    items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'COMMERCE',
    items: [
      { href: '/stores', label: 'My Stores', icon: Store },
      { href: '/products', label: 'Products', icon: Package },
      { href: '/orders', label: 'Orders', icon: ShoppingCart },
    ],
  },
  {
    title: 'SETTINGS',
    items: [{ href: '/settings', label: 'Settings', icon: Settings }],
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
      roleLabel="MERCHANT"
      userName={user?.email?.split('@')[0] || 'Merchant'}
      userMeta="Merchant"
      userInitial={user?.email?.[0]?.toUpperCase() || 'M'}
      onLogout={logout}
    />
  );
}
