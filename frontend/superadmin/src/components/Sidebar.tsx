'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard, Users, Shield, Settings, Wallet,
  FileText, AlertTriangle, LogOut
} from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admins', label: 'Admin Accounts', icon: Users },
  { href: '/settings', label: 'Platform Settings', icon: Settings },
  { href: '/wallet-ledger', label: 'Wallet Ledger', icon: Wallet },
  { href: '/blacklist', label: 'Fraud & Blacklist', icon: AlertTriangle },
  { href: '/audit-log', label: 'Audit Log', icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuthStore();

  return (
    <aside className="w-64 h-screen bg-dark-surface border-r border-dark-border flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-dark-border">
        <h1 className="text-xl font-bold">
          <span className="text-primary">RAPEX</span>{' '}
          <span className="text-dark-muted text-sm">SuperAdmin</span>
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors',
              pathname === href
                ? 'bg-primary/10 text-primary'
                : 'text-dark-muted hover:text-dark-text hover:bg-dark-bg'
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-dark-border">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-dark-muted hover:text-red-400 w-full transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
