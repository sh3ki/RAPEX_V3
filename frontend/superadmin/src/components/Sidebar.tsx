'use client';

import { LayoutDashboard, Users, Settings, Wallet, AlertTriangle, FileText } from 'lucide-react';
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
      { href: '/admins', label: 'Admin Accounts', icon: Users },
      { href: '/settings', label: 'Platform Settings', icon: Settings },
    ],
  },
  {
    title: 'FINANCE',
    items: [{ href: '/wallet-ledger', label: 'Wallet Ledger', icon: Wallet }],
  },
  {
    title: 'SECURITY',
    items: [
      { href: '/blacklist', label: 'Fraud & Blacklist', icon: AlertTriangle },
      { href: '/audit-log', label: 'Audit Log', icon: FileText },
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
      roleLabel="SUPERADMIN"
      userName={user?.email?.split('@')[0] || 'SuperAdmin'}
      userMeta="Super Admin"
      userInitial={user?.email?.[0]?.toUpperCase() || 'S'}
      onLogout={logout}
    />
  );
}
