interface StatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  active: 'badge-green',
  completed: 'badge-green',
  approved: 'badge-green',
  open: 'badge-green',
  delivered: 'badge-green',
  processing: 'badge-blue',
  preparing: 'badge-blue',
  in_transit: 'badge-blue',
  pending: 'badge-yellow',
  closed: 'badge-red',
  cancelled: 'badge-red',
  rejected: 'badge-red',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const style = statusStyles[status.toLowerCase()] || 'badge-blue';
  return <span className={style}>{status}</span>;
}
