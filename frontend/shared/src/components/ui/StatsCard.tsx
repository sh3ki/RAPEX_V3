'use client';

import { TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down';
  icon?: LucideIcon;
  accent?: 'primary' | 'blue' | 'green' | 'purple';
  color?: 'primary' | 'blue' | 'green' | 'purple';
}

const accentMap: Record<NonNullable<StatsCardProps['accent']>, { bg: string; icon: string }> = {
  primary: { bg: 'bg-primary-50', icon: 'text-primary-600' },
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600' },
  green: { bg: 'bg-emerald-50', icon: 'text-emerald-600' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600' },
};

export function StatsCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  accent = 'primary',
  color,
}: StatsCardProps) {
  const effectiveAccent = color ?? accent;
  const style = accentMap[effectiveAccent];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {change ? (
            <div className="mt-2 flex items-center gap-1">
              {trend === 'down' ? (
                <TrendingDown size={14} className="text-red-500" />
              ) : (
                <TrendingUp size={14} className="text-emerald-500" />
              )}
              <span className={cn('text-xs font-semibold', trend === 'down' ? 'text-red-600' : 'text-emerald-600')}>
                {change}
              </span>
              <span className="text-xs text-gray-400">vs last period</span>
            </div>
          ) : null}
        </div>

        {Icon ? (
          <div className={cn('rounded-xl p-2.5', style.bg)}>
            <Icon size={20} className={style.icon} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
