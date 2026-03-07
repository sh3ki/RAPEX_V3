'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, Heart, Bell, User } from 'lucide-react';

const tabs = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/orders', icon: ShoppingBag, label: 'Orders' },
  { href: '/wallet', icon: Heart, label: 'Wallet' },
  { href: '/notifications', icon: Bell, label: 'Alerts' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-dark-surface border-t border-dark-border z-50 safe-area-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16">
        {tabs.map((t) => {
          const active = t.href === '/' ? pathname === '/' : pathname.startsWith(t.href);
          return (
            <Link key={t.href} href={t.href} className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${active ? 'text-primary-500' : 'text-dark-muted hover:text-dark-text'}`}>
              <t.icon size={22} />
              <span className="text-[10px] font-medium">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
