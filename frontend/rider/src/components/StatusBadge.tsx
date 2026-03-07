interface StatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  active: 'badge-green',
  completed: 'badge-green',
  delivered: 'badge-green',
  picked_up: 'badge-blue',
  in_transit: 'badge-blue',
  processing: 'badge-blue',
  pending: 'badge-yellow',
  assigned: 'badge-yellow',
  cancelled: 'badge-red',
  failed: 'badge-red',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const style = statusStyles[status.toLowerCase()] || 'badge-blue';
  return <span className={style}>{status}</span>;
}
