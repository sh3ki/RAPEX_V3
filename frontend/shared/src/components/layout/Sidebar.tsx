'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, LogOut, type LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SidebarItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

interface SidebarProps {
  sections: SidebarSection[];
  activePath: string;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  brandLabel?: string;
  roleLabel?: string;
  userName?: string;
  userMeta?: string;
  userInitial?: string;
  onLogout: () => void;
}

export function Sidebar({
  sections,
  activePath,
  collapsed,
  onCollapsedChange,
  brandLabel = 'RAPEX',
  roleLabel,
  userName,
  userMeta,
  userInitial = 'R',
  onLogout,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 hidden h-screen border-r border-gray-200 bg-white lg:flex lg:flex-col',
        'transition-all duration-300',
        collapsed ? 'w-[70px]' : 'w-[260px]',
      )}
    >
      <div className="relative flex items-center gap-3 border-b border-gray-100 px-5 py-5">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary-500 text-lg font-bold text-white">R</div>

        {!collapsed ? (
          <div className="overflow-hidden">
            <span className="text-lg font-bold text-gray-900">{brandLabel}</span>
            {roleLabel ? <span className="block text-[11px] font-medium tracking-wide text-gray-400">{roleLabel}</span> : null}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => onCollapsedChange(!collapsed)}
          className="absolute -right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 shadow-sm transition-colors hover:text-gray-600"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.title} className="mb-5">
            {!collapsed ? (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{section.title}</p>
            ) : null}
            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon }) => {
                const active = activePath === href || activePath.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    title={collapsed ? label : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all',
                      active ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
                      collapsed ? 'justify-center' : '',
                    )}
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    {!collapsed ? <span className="truncate">{label}</span> : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-100 p-3">
        {collapsed ? (
          <button
            type="button"
            onClick={onLogout}
            title="Logout"
            className="flex w-full items-center justify-center rounded-lg p-2.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <LogOut size={18} />
          </button>
        ) : (
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-600">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">{userName || 'User'}</p>
              <p className="text-[11px] text-gray-400">{userMeta || roleLabel || 'Role'}</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              title="Logout"
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
