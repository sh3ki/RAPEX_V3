import { LucideIcon } from 'lucide-react';

interface StatCardProps { label: string; value: string | number; icon: LucideIcon; color?: string; }

export default function StatCard({ label, value, icon: Icon, color = 'text-primary' }: StatCardProps) {
  return (
    <div className="card flex items-start justify-between">
      <div>
        <p className="text-dark-muted text-sm">{label}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-lg bg-dark-bg ${color}`}><Icon size={22} /></div>
    </div>
  );
}
