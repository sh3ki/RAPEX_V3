interface StatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  active: 'badge-green',
  completed: 'badge-green',
  delivered: 'badge-green',
  confirmed: 'badge-green',
  processing: 'badge-blue',
  in_transit: 'badge-blue',
  preparing: 'badge-blue',
  pending: 'badge-yellow',
  cancelled: 'badge-red',
  failed: 'badge-red',
  refunded: 'badge-red',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const style = statusStyles[status.toLowerCase()] || 'badge-blue';
  return <span className={style}>{status}</span>;
}
