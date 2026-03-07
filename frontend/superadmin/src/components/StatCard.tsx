interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}

export default function StatCard({ title, value, icon, color = 'text-primary' }: StatCardProps) {
  return (
    <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-dark-muted text-sm">{title}</span>
        <span className={color}>{icon}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
