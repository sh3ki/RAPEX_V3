interface StatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  active: 'badge-green',
  completed: 'badge-green',
  approved: 'badge-green',
  verified: 'badge-green',
  processing: 'badge-blue',
  pending: 'badge-yellow',
  suspended: 'badge-red',
  cancelled: 'badge-red',
  rejected: 'badge-red',
  deactivated: 'badge-red',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const style = statusStyles[status.toLowerCase()] || 'badge-blue';
  return <span className={style}>{status}</span>;
}
