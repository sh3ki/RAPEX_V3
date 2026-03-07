'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard,
  Users,
  Store,
  Bike,
  ShoppingCart,
  BarChart3,
  Bell,
  ShieldAlert,
  Gift,
  MessageSquare,
  LogOut,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/merchants', label: 'Merchants', icon: Store },
  { href: '/riders', label: 'Riders', icon: Bike },
  { href: '/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/fraud', label: 'Fraud', icon: ShieldAlert },
  { href: '/referrals', label: 'Referrals', icon: Gift },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
];

export default function Sidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen bg-dark-surface border-r border-dark-border fixed left-0 top-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-dark-border">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg">
          R
        </div>
        <div>
          <span className="text-lg font-bold text-white">RAPEX</span>
          <span className="block text-xs text-dark-muted">Admin Portal</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-dark-muted hover:text-dark-text hover:bg-dark-bg'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-dark-border">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 w-full transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
