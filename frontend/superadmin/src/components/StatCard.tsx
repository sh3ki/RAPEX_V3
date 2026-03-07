import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: LucideIcon;
  color?: string;
}

export default function StatCard({ title, value, change, trend, icon: Icon, color = 'primary' }: StatCardProps) {
  const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
    primary: { bg: 'bg-primary-50', text: 'text-primary-600', icon: 'text-primary-500' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-500' },
    green: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'text-emerald-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'text-purple-500' },
  };

  const c = colorMap[color] || colorMap.primary;

  return (
    <div className="card flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        <div className="flex items-center gap-1 mt-2">
          {trend === 'up' ? (
            <TrendingUp size={14} className="text-emerald-500" />
          ) : (
            <TrendingDown size={14} className="text-red-500" />
          )}
          <span className={`text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
            {change}
          </span>
          <span className="text-xs text-gray-400 ml-1">vs last month</span>
        </div>
      </div>
      <div className={`${c.bg} p-3 rounded-xl`}>
        <Icon size={22} className={c.icon} />
      </div>
    </div>
  );
}
