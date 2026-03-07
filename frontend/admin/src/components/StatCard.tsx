import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: string;
}

export default function StatCard({ label, value, icon: Icon, trend, trendUp, color = 'text-primary' }: StatCardProps) {
  return (
    <div className="card flex items-start justify-between">
      <div>
        <p className="text-dark-muted text-sm">{label}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
        {trend && (
          <p className={`text-xs mt-1 ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-lg bg-dark-bg ${color}`}>
        <Icon size={22} />
      </div>
    </div>
  );
}
