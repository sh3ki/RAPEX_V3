'use client';

import { Home, ShoppingCart, ShoppingBag, Wallet, Bell, Gift, User } from 'lucide-react';
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
    title: 'HOME',
    items: [{ href: '/stores', label: 'Home', icon: Home }],
  },
  {
    title: 'SHOPPING',
    items: [
      { href: '/cart', label: 'Cart', icon: ShoppingCart },
      { href: '/orders', label: 'Orders', icon: ShoppingBag },
    ],
  },
  {
    title: 'FINANCE',
    items: [{ href: '/wallet', label: 'Wallet', icon: Wallet }],
  },
  {
    title: 'ACCOUNT',
    items: [
      { href: '/notifications', label: 'Notifications', icon: Bell },
      { href: '/referral', label: 'Referral', icon: Gift },
      { href: '/profile', label: 'Profile', icon: User },
    ],
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
      roleLabel="USER"
      userName={user?.email?.split('@')[0] || 'User'}
      userMeta="User"
      userInitial={user?.email?.[0]?.toUpperCase() || 'U'}
      onLogout={logout}
    />
  );
}
