'use client';

import { LayoutDashboard, Users, Store, Bike, ShoppingCart, BarChart3, Bell, Shield, Gift, MessageSquare } from 'lucide-react';
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

  const collapsed = collapsedProp ?? localCollapsed;
  const setCollapsed = onCollapsedChange ?? setLocalCollapsed;

  return (
    <SharedSidebar
      sections={sections}
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
