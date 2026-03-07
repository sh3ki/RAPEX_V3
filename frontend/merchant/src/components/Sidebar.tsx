'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard, Store, Package, ShoppingCart,
  Settings, LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

const sections = [
  {
    title: 'OVERVIEW',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
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
    items: [
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-40 transition-all duration-300 ${collapsed ? 'w-[70px]' : 'w-[260px]'}`}>
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100 relative">
        <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">R</div>
        {!collapsed && (
          <div className="overflow-hidden">
            <span className="text-lg font-bold text-gray-900">RAPEX</span>
            <span className="block text-[11px] text-gray-400 font-medium tracking-wide">MERCHANT</span>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {sections.map((section) => (
          <div key={section.title} className="mb-5">
            {!collapsed && <p className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase px-3 mb-2">{section.title}</p>}
            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/');
                return (
                  <Link key={href} href={href} title={collapsed ? label : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${active ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'} ${collapsed ? 'justify-center' : ''}`}>
                    <Icon size={18} className="flex-shrink-0" />
                    {!collapsed && <span className="truncate">{label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-100 p-3">
        {collapsed ? (
          <button onClick={logout} title="Logout" className="w-full flex items-center justify-center p-2.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <LogOut size={18} />
          </button>
        ) : (
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm flex-shrink-0">
              {user?.email?.[0]?.toUpperCase() || 'M'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.email?.split('@')[0] || 'Merchant'}</p>
              <p className="text-[11px] text-gray-400">Merchant</p>
            </div>
            <button onClick={logout} title="Logout" className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
